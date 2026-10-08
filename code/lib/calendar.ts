import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export type CalendarProvider = "GOOGLE" | "OUTLOOK";
export type CalendarEvent = {
  id: string;
  provider: CalendarProvider;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  url: string | null;
  location: string | null;
};

type ProviderConnection = {
  id: string;
  provider: CalendarProvider;
  providerAccountId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string | null;
  userId: string;
};

const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.calendarlist.readonly";
const MS_SCOPES = "openid profile email offline_access User.Read Calendars.Read";

class CalendarProviderHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "CalendarProviderHttpError";
  }
}

function encryptionKey() {
  const encoded = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
  if (!encoded) throw new Error("Calendar token encryption is not configured.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("Calendar token encryption key must be 32 bytes (base64 encoded).");
  return key;
}

export function encryptCalendarToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptCalendarToken(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new Error("Stored calendar credentials are invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function normalizeProvider(value: string): CalendarProvider | null {
  const provider = value.toUpperCase();
  return provider === "GOOGLE" || provider === "OUTLOOK" ? provider : null;
}

export function providerEnvironment(provider: CalendarProvider) {
  if (provider === "GOOGLE") {
    return {
      clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    };
  }
  return {
    clientId: process.env.MICROSOFT_CALENDAR_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET,
  };
}

export function calendarRedirectUri(provider: CalendarProvider) {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) throw new Error("NEXTAUTH_URL is not configured.");
  return `${baseUrl.replace(/\/$/, "")}/api/calendar/callback/${provider.toLowerCase()}`;
}

export function calendarAuthorizationUrl(provider: CalendarProvider, state: string) {
  const { clientId } = providerEnvironment(provider);
  if (!clientId) throw new Error(`${provider} calendar credentials are not configured.`);
  const redirectUri = calendarRedirectUri(provider);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });

  if (provider === "GOOGLE") {
    params.set("scope", `openid email ${GOOGLE_SCOPES}`);
    params.set("access_type", "offline");
    params.set("prompt", "consent");
    params.set("include_granted_scopes", "true");
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  params.set("scope", MS_SCOPES);
  params.set("response_mode", "query");
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

async function postTokenForm(url: string, values: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error_description === "string" ? body.error_description : "The calendar provider rejected the authorization request.");
  return body as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
}

async function providerAccountId(provider: CalendarProvider, accessToken: string) {
  const url = provider === "GOOGLE" ? "https://openidconnect.googleapis.com/v1/userinfo" : "https://graph.microsoft.com/v1.0/me?$select=id";
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Could not identify the connected calendar account.");
  const account = await response.json();
  if (typeof account.sub !== "string" && typeof account.id !== "string") throw new Error("The calendar provider returned an invalid account.");
  return (account.sub ?? account.id) as string;
}

export async function exchangeCalendarCode(provider: CalendarProvider, code: string, userId: string) {
  const { clientId, clientSecret } = providerEnvironment(provider);
  if (!clientId || !clientSecret) throw new Error(`${provider} calendar credentials are not configured.`);
  const values = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: calendarRedirectUri(provider),
  };
  const tokens = provider === "GOOGLE"
    ? await postTokenForm("https://oauth2.googleapis.com/token", values)
    : await postTokenForm("https://login.microsoftonline.com/common/oauth2/v2.0/token", { ...values, scope: MS_SCOPES });
  const accountId = await providerAccountId(provider, tokens.access_token);
  const previous = await prisma.calendarConnection.findUnique({ where: { userId_provider: { userId, provider } } });
  const refreshToken = tokens.refresh_token ?? (previous ? decryptCalendarToken(previous.refreshToken) : null);
  if (!refreshToken) throw new Error("The provider did not issue a refresh token. Disconnect and reconnect with offline access enabled.");

  return prisma.calendarConnection.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      providerAccountId: accountId,
      accessToken: encryptCalendarToken(tokens.access_token),
      refreshToken: encryptCalendarToken(refreshToken),
      expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
      scope: tokens.scope ?? null,
    },
    update: {
      providerAccountId: accountId,
      accessToken: encryptCalendarToken(tokens.access_token),
      refreshToken: encryptCalendarToken(refreshToken),
      expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
      scope: tokens.scope ?? previous?.scope ?? null,
    },
  });
}

async function refreshConnection(connection: ProviderConnection): Promise<ProviderConnection> {
  const { clientId, clientSecret } = providerEnvironment(connection.provider);
  if (!clientId || !clientSecret) throw new Error(`${connection.provider} calendar credentials are not configured.`);
  const url = connection.provider === "GOOGLE"
    ? "https://oauth2.googleapis.com/token"
    : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const values: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: decryptCalendarToken(connection.refreshToken),
  };
  if (connection.provider === "OUTLOOK") values.scope = MS_SCOPES;
  const tokens = await postTokenForm(url, values);
  const updated = await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: encryptCalendarToken(tokens.access_token),
      refreshToken: tokens.refresh_token ? encryptCalendarToken(tokens.refresh_token) : connection.refreshToken,
      expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
      scope: tokens.scope ?? connection.scope,
    },
  });
  return updated as ProviderConnection;
}

async function getValidAccessToken(connection: ProviderConnection) {
  const validConnection = connection.expiresAt.getTime() < Date.now() + 60_000
    ? await refreshConnection(connection)
    : connection;
  return decryptCalendarToken(validConnection.accessToken);
}

async function providerFetch(url: string, token: string, extraHeaders: Record<string, string> = {}) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, ...extraHeaders }, signal: AbortSignal.timeout(12000) });
      if (response.ok) return response;
      if ((response.status === 429 || response.status >= 500) && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      if (response.status === 401) throw new Error("Calendar access expired. Reconnect this provider and try again.");
      const body = await response.json().catch(() => null);
      const details = body?.error;
      const reasons = Array.isArray(details?.errors)
        ? details.errors.map((item: { reason?: unknown }) => item.reason).filter((reason: unknown) => typeof reason === "string")
        : [];
      if (response.status === 403 && url.includes("googleapis.com")) {
        if (reasons.includes("accessNotConfigured") || reasons.includes("serviceDisabled")) {
          throw new CalendarProviderHttpError(403, "Google Calendar API is not enabled for this Google Cloud project. Enable it in Google Cloud Console, then retry sync.");
        }
        if (reasons.includes("insufficientPermissions")) {
          throw new CalendarProviderHttpError(403, "Google did not grant the calendar read permissions. Disconnect Google Calendar, reconnect, and approve the requested access.");
        }
        throw new CalendarProviderHttpError(403, "Google denied calendar access (403). Check that the Calendar API is enabled for the OAuth project, then reconnect Google Calendar and retry.");
      }
      if (response.status === 403) {
        throw new CalendarProviderHttpError(403, "The calendar provider denied access (403). Reconnect this provider and confirm its read-calendar permission is enabled.");
      }
      throw new CalendarProviderHttpError(response.status, `The calendar provider returned ${response.status}.`);
    } catch (error) {
      lastError = error;
      if (error instanceof CalendarProviderHttpError && error.status < 500 && error.status !== 429) throw error;
      if (attempt === 0 && !(error instanceof Error && error.message.startsWith("The calendar provider returned")) && !(error instanceof Error && error.message.startsWith("Calendar access expired"))) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Calendar synchronization failed.");
}

function googleDateTime(event: any, edge: "start" | "end") {
  const value = event[edge]?.dateTime ?? event[edge]?.date;
  return typeof value === "string" ? value : null;
}

async function fetchGoogleEvents(connection: ProviderConnection, start: string, end: string): Promise<CalendarEvent[]> {
  const token = await getValidAccessToken(connection);
  const calendarList: { id: string; summary?: string }[] = [];
  let calendarUrl: string | undefined = "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250";
  while (calendarUrl && calendarList.length < 1000) {
    const response = await providerFetch(calendarUrl, token);
    const body = await response.json();
    calendarList.push(...(body.items ?? []).filter((calendar: any) => typeof calendar.id === "string"));
    calendarUrl = typeof body.nextPageToken === "string"
      ? `https://www.googleapis.com/calendar/v3/users/me/calendarList?${new URLSearchParams({ maxResults: "250", pageToken: body.nextPageToken })}`
      : undefined;
  }

  const calendars = calendarList.length ? calendarList : [{ id: "primary" }];
  const perCalendar = await Promise.all(calendars.map(async (calendar) => {
    const events: CalendarEvent[] = [];
    const params = new URLSearchParams({ timeMin: start, timeMax: end, singleEvents: "true", orderBy: "startTime", maxResults: "2500" });
    let eventsUrl: string | undefined = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`;
    while (eventsUrl && events.length < 2500) {
      const response = await providerFetch(eventsUrl, token);
      const body = await response.json();
      events.push(...(body.items ?? []).flatMap((event: any) => {
        const eventStart = googleDateTime(event, "start");
        const eventEnd = googleDateTime(event, "end");
        if (!eventStart || !eventEnd || event.status === "cancelled") return [];
        return [{ id: `google:${calendar.id}:${event.id}`, provider: "GOOGLE" as const, title: event.summary || calendar.summary || "Untitled event", start: eventStart, end: eventEnd, allDay: Boolean(event.start?.date), url: event.htmlLink ?? null, location: event.location ?? null }];
      }));
      eventsUrl = typeof body.nextPageToken === "string"
        ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${new URLSearchParams({ ...Object.fromEntries(params), pageToken: body.nextPageToken })}`
        : undefined;
    }
    return events;
  }));
  return perCalendar.flat();
}

async function fetchOutlookEvents(connection: ProviderConnection, start: string, end: string): Promise<CalendarEvent[]> {
  const token = await getValidAccessToken(connection);
  const params = new URLSearchParams({ startDateTime: start, endDateTime: end, "$select": "id,subject,start,end,isAllDay,webLink,location", "$orderby": "start/dateTime", "$top": "500" });
  let nextUrl: string | undefined = `https://graph.microsoft.com/v1.0/me/calendarView?${params}`;
  const events: CalendarEvent[] = [];
  while (nextUrl && events.length < 2500) {
    const response = await providerFetch(nextUrl, token, { Prefer: 'outlook.timezone="UTC"' });
    const body = await response.json();
    events.push(...(body.value ?? []).flatMap((event: any) => {
      if (!event.start?.dateTime || !event.end?.dateTime) return [];
      return [{
        id: `outlook:${event.id}`,
        provider: "OUTLOOK" as const,
        title: event.subject || "Untitled event",
        start: event.isAllDay ? event.start.dateTime.slice(0, 10) : `${event.start.dateTime}${event.start.timeZone === "UTC" ? "Z" : ""}`,
        end: event.isAllDay ? event.end.dateTime.slice(0, 10) : `${event.end.dateTime}${event.end.timeZone === "UTC" ? "Z" : ""}`,
        allDay: Boolean(event.isAllDay),
        url: event.webLink ?? null,
        location: event.location?.displayName ?? null,
      }];
    }));
    nextUrl = typeof body["@odata.nextLink"] === "string" ? body["@odata.nextLink"] : undefined;
  }
  return events;
}

export async function synchronizeCalendarEvents(userId: string, start: string, end: string) {
  const connections = await prisma.calendarConnection.findMany({ where: { userId } }) as ProviderConnection[];
  const results = await Promise.all(connections.map(async (connection) => {
    try {
      const events = connection.provider === "GOOGLE"
        ? await fetchGoogleEvents(connection, start, end)
        : await fetchOutlookEvents(connection, start, end);
      return { provider: connection.provider, events, error: null as string | null };
    } catch (error) {
      console.error(`Calendar sync failed for ${connection.provider}:`, error);
      return {
        provider: connection.provider,
        events: [] as CalendarEvent[],
        error: error instanceof Error ? error.message : "Could not synchronize this calendar. Check your connection and retry.",
      };
    }
  }));
  return {
    events: results.flatMap((result) => result.events).sort((a, b) => a.start.localeCompare(b.start)),
    errors: results.filter((result) => result.error).map(({ provider, error }) => ({ provider, message: error! })),
  };
}

export function calendarProviderName(provider: CalendarProvider) {
  return provider === "GOOGLE" ? "Google Calendar" : "Outlook";
}
