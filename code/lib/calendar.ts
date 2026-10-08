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
export type CalendarSyncResult = {
  events: CalendarEvent[];
  errors: { provider: CalendarProvider | null; message: string }[];
  warnings: { provider: CalendarProvider; message: string }[];
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
  /** Identifies a failed HTTP response from an external calendar API. */
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "CalendarProviderHttpError";
  }
}

export class CalendarSyncBusyError extends Error {
  /** Marks a request rejected by the per-user synchronization concurrency limit. */
  constructor() {
    super("A calendar sync is already running. Please retry in a moment.");
    this.name = "CalendarSyncBusyError";
  }
}

const MAX_GOOGLE_CALENDARS = 20;
const MAX_GOOGLE_EVENTS = 500;
const MAX_OUTLOOK_EVENTS = 500;
const MAX_PROVIDER_RESPONSE_BYTES = 512 * 1024;
const MAX_PROVIDER_SYNC_MS = 25_000;
const MAX_SYNC_REQUESTS_PER_USER = 2;
const MAX_ACTIVE_SYNC_REQUESTS = 8;
const SYNC_CACHE_TTL_MS = 10_000;
const MAX_SYNC_CACHE_ENTRIES = 32;
const syncsInFlight = new Map<string, Promise<CalendarSyncResult>>();
const activeSyncsByUser = new Map<string, Set<string>>();
const successfulSyncCache = new Map<string, { expiresAt: number; result: CalendarSyncResult }>();
const syncGenerationByUser = new Map<string, number>();

/** Reads and validates the server-only key used to encrypt provider grants. */
function encryptionKey() {
  const encoded = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
  if (!encoded) throw new Error("Calendar token encryption is not configured.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("Calendar token encryption key must be 32 bytes (base64 encoded).");
  return key;
}

/** Encrypts an OAuth token with AES-256-GCM before database storage. */
export function encryptCalendarToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

/** Authenticates and decrypts an OAuth token read from the database. */
function decryptCalendarToken(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new Error("Stored calendar credentials are invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

/** Normalizes a provider route parameter to one of the supported providers. */
export function normalizeProvider(value: string): CalendarProvider | null {
  const provider = value.toUpperCase();
  return provider === "GOOGLE" || provider === "OUTLOOK" ? provider : null;
}

/** Reads the OAuth client configuration for a calendar provider. */
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

/** Builds the callback URL registered with the provider's OAuth application. */
export function calendarRedirectUri(provider: CalendarProvider) {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) throw new Error("NEXTAUTH_URL is not configured.");
  return `${baseUrl.replace(/\/$/, "")}/api/calendar/callback/${provider.toLowerCase()}`;
}

/** Creates the provider authorization URL with read-only calendar scopes. */
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

/** Exchanges an authorization or refresh grant for provider tokens. */
async function postTokenForm(url: string, values: Record<string, string>, timeoutMs = 15000) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error_description === "string" ? body.error_description : "The calendar provider rejected the authorization request.");
  return body as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
}

/** Resolves the external account ID associated with an access token. */
async function providerAccountId(provider: CalendarProvider, accessToken: string) {
  const url = provider === "GOOGLE" ? "https://openidconnect.googleapis.com/v1/userinfo" : "https://graph.microsoft.com/v1.0/me?$select=id";
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Could not identify the connected calendar account.");
  const account = await response.json();
  if (typeof account.sub !== "string" && typeof account.id !== "string") throw new Error("The calendar provider returned an invalid account.");
  return (account.sub ?? account.id) as string;
}

/** Stores a provider grant for the authenticated user after validating its account. */
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
  const refreshToken = tokens.refresh_token ?? (previous?.providerAccountId === accountId ? decryptCalendarToken(previous.refreshToken) : null);
  if (!refreshToken) throw new Error("The provider did not issue a refresh token. Disconnect and reconnect with offline access enabled.");

  const saved = await prisma.calendarConnection.upsert({
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
  invalidateCalendarSyncCache(userId);
  return saved;
}

/** Refreshes credentials without overwriting a newer reconnect or token rotation. */
async function refreshConnection(connection: ProviderConnection, deadline: number): Promise<ProviderConnection> {
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
  const remainingMs = deadline - Date.now();
  if (remainingMs <= 0) throw new Error("Calendar synchronization reached its time limit. Retry with a smaller date range.");
  const tokens = await postTokenForm(url, values, Math.min(6000, remainingMs));
  const accessToken = encryptCalendarToken(tokens.access_token);
  const refreshToken = tokens.refresh_token ? encryptCalendarToken(tokens.refresh_token) : connection.refreshToken;
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);
  const update = await prisma.calendarConnection.updateMany({
    where: {
      id: connection.id,
      providerAccountId: connection.providerAccountId,
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
    },
    data: {
      accessToken,
      refreshToken,
      expiresAt,
      scope: tokens.scope ?? connection.scope,
    },
  });
  const latest = await prisma.calendarConnection.findUnique({ where: { id: connection.id } });
  if (!latest || latest.providerAccountId !== connection.providerAccountId) {
    throw new Error("Calendar connection changed while refreshing. Retry synchronization.");
  }
  if (!update.count && latest.accessToken === connection.accessToken) {
    throw new Error("Calendar credentials changed while refreshing. Retry synchronization.");
  }
  return latest as ProviderConnection;
}

/** Returns an unexpired access token, refreshing the saved grant when needed. */
async function getValidAccessToken(connection: ProviderConnection, deadline: number) {
  const validConnection = connection.expiresAt.getTime() < Date.now() + 60_000
    ? await refreshConnection(connection, deadline)
    : connection;
  return decryptCalendarToken(validConnection.accessToken);
}

/** Fetches a provider resource with a deadline, bounded retries, and clear permission errors. */
async function providerFetch(url: string, token: string, deadline: number, extraHeaders: Record<string, string> = {}) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) throw new Error("Calendar synchronization reached its time limit. Retry with a smaller date range.");
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, ...extraHeaders }, signal: AbortSignal.timeout(Math.min(8000, remainingMs)) });
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

/** Reads provider JSON while enforcing a maximum response size. */
async function readProviderJson(response: Response): Promise<unknown> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_PROVIDER_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new Error("Calendar provider response exceeded the synchronization size limit.");
  }
  if (!response.body) return response.json();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_PROVIDER_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("Calendar provider response exceeded the synchronization size limit.");
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(joined));
}

/** Narrows unknown JSON values to plain provider response records. */
function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

/** Narrows provider JSON arrays to records, skipping malformed entries. */
function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

/** Returns a string-valued field from an untrusted provider record. */
function stringField(record: Record<string, unknown>, key: string): string | undefined {
  return typeof record[key] === "string" ? record[key] : undefined;
}

/** Converts a provider event's start or end value to a normalized ISO/date string. */
function googleDateTime(event: Record<string, unknown>, edge: "start" | "end") {
  const value = asRecord(event[edge]);
  const dateTime = stringField(value, "dateTime");
  const date = stringField(value, "date");
  return dateTime ?? date ?? null;
}

/** Reads Google calendars and events within per-request calendar, event, and time limits. */
async function fetchGoogleEvents(connection: ProviderConnection, start: string, end: string, deadline: number) {
  const token = await getValidAccessToken(connection, deadline);
  const calendarList: { id: string; summary?: string }[] = [];
  let calendarUrl: string | undefined = "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250";
  while (calendarUrl && calendarList.length < MAX_GOOGLE_CALENDARS + 1) {
    const response = await providerFetch(calendarUrl, token, deadline);
    const body = asRecord(await readProviderJson(response));
    const calendars = asRecordArray(body.items).flatMap((calendar) => {
      const id = stringField(calendar, "id");
      return id ? [{ id, summary: stringField(calendar, "summary") }] : [];
    });
    calendarList.push(...calendars.slice(0, MAX_GOOGLE_CALENDARS + 1 - calendarList.length));
    const nextPageToken = stringField(body, "nextPageToken");
    calendarUrl = nextPageToken
      ? `https://www.googleapis.com/calendar/v3/users/me/calendarList?${new URLSearchParams({ maxResults: "250", pageToken: nextPageToken })}`
      : undefined;
  }

  const calendars = calendarList.length ? calendarList.slice(0, MAX_GOOGLE_CALENDARS) : [{ id: "primary" }];
  const events: CalendarEvent[] = [];
  for (const calendar of calendars) {
    const params = new URLSearchParams({ timeMin: start, timeMax: end, singleEvents: "true", orderBy: "startTime", maxResults: "100" });
    let eventsUrl: string | undefined = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params}`;
    while (eventsUrl && events.length < MAX_GOOGLE_EVENTS && Date.now() < deadline) {
      const remaining = MAX_GOOGLE_EVENTS - events.length;
      params.set("maxResults", String(Math.min(100, remaining)));
      const response = await providerFetch(eventsUrl, token, deadline);
      const body = asRecord(await readProviderJson(response));
      const pageEvents: CalendarEvent[] = asRecordArray(body.items).flatMap((event) => {
        const eventStart = googleDateTime(event, "start");
        const eventEnd = googleDateTime(event, "end");
        const id = stringField(event, "id");
        if (!eventStart || !eventEnd || !id || event.status === "cancelled") return [];
        return [{ id: `google:${calendar.id}:${id}`, provider: "GOOGLE" as const, title: stringField(event, "summary") || calendar.summary || "Untitled event", start: eventStart, end: eventEnd, allDay: Boolean(stringField(asRecord(event.start), "date")), url: stringField(event, "htmlLink") ?? null, location: stringField(event, "location") ?? null }];
      });
      events.push(...pageEvents.slice(0, remaining));
      const nextPageToken = stringField(body, "nextPageToken");
      eventsUrl = nextPageToken && events.length < MAX_GOOGLE_EVENTS
        ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${new URLSearchParams({ ...Object.fromEntries(params), pageToken: nextPageToken })}`
        : undefined;
    }
    if (events.length >= MAX_GOOGLE_EVENTS || Date.now() >= deadline) break;
  }
  return {
    events,
    warnings: [
      ...(calendarList.length > MAX_GOOGLE_CALENDARS ? [{ provider: "GOOGLE" as const, message: `Showing up to ${MAX_GOOGLE_CALENDARS} Google calendars per sync.` }] : []),
      ...(events.length >= MAX_GOOGLE_EVENTS ? [{ provider: "GOOGLE" as const, message: `Showing up to ${MAX_GOOGLE_EVENTS} Google events per sync.` }] : []),
      ...(Date.now() >= deadline ? [{ provider: "GOOGLE" as const, message: "Google sync reached its time limit; showing events retrieved so far." }] : []),
    ],
  };
}

/** Reads Outlook events with pagination, response, and overall time limits. */
async function fetchOutlookEvents(connection: ProviderConnection, start: string, end: string, deadline: number) {
  const token = await getValidAccessToken(connection, deadline);
  const params = new URLSearchParams({ startDateTime: start, endDateTime: end, "$select": "id,subject,start,end,isAllDay,webLink,location", "$orderby": "start/dateTime", "$top": "500" });
  let nextUrl: string | undefined = `https://graph.microsoft.com/v1.0/me/calendarView?${params}`;
  const events: CalendarEvent[] = [];
  while (nextUrl && events.length < MAX_OUTLOOK_EVENTS && Date.now() < deadline) {
    const response = await providerFetch(nextUrl, token, deadline, { Prefer: 'outlook.timezone="UTC"' });
    const body = asRecord(await readProviderJson(response));
    events.push(...asRecordArray(body.value).slice(0, MAX_OUTLOOK_EVENTS - events.length).flatMap((event) => {
      const eventStart = asRecord(event.start);
      const eventEnd = asRecord(event.end);
      const startDateTime = stringField(eventStart, "dateTime");
      const endDateTime = stringField(eventEnd, "dateTime");
      const id = stringField(event, "id");
      if (!startDateTime || !endDateTime || !id) return [];
      const location = stringField(asRecord(event.location), "displayName");
      return [{
        id: `outlook:${id}`,
        provider: "OUTLOOK" as const,
        title: stringField(event, "subject") || "Untitled event",
        start: event.isAllDay === true ? startDateTime.slice(0, 10) : `${startDateTime}${eventStart.timeZone === "UTC" ? "Z" : ""}`,
        end: event.isAllDay === true ? endDateTime.slice(0, 10) : `${endDateTime}${eventEnd.timeZone === "UTC" ? "Z" : ""}`,
        allDay: Boolean(event.isAllDay),
        url: stringField(event, "webLink") ?? null,
        location: location ?? null,
      }];
    }));
    nextUrl = events.length < MAX_OUTLOOK_EVENTS ? stringField(body, "@odata.nextLink") : undefined;
  }
  return {
    events,
    warnings: events.length >= MAX_OUTLOOK_EVENTS
      ? [{ provider: "OUTLOOK" as const, message: `Showing up to ${MAX_OUTLOOK_EVENTS} Outlook events per sync.` }]
      : Date.now() >= deadline
        ? [{ provider: "OUTLOOK" as const, message: "Outlook sync reached its time limit; showing events retrieved so far." }]
        : [],
  };
}

/** Synchronizes a user's connected calendars with bounded, coalesced work. */
export async function synchronizeCalendarEvents(userId: string, start: string, end: string): Promise<CalendarSyncResult> {
  const generation = syncGenerationByUser.get(userId) ?? 0;
  const key = `${userId}:${generation}:${start}:${end}`;
  const now = Date.now();
  for (const [cacheKey, entry] of successfulSyncCache) if (entry.expiresAt <= now) successfulSyncCache.delete(cacheKey);
  const cached = successfulSyncCache.get(key);
  if (cached) return cached.result;
  const existing = syncsInFlight.get(key);
  if (existing) return existing;
  const active = activeSyncsByUser.get(userId) ?? new Set<string>();
  if (active.size >= MAX_SYNC_REQUESTS_PER_USER || syncsInFlight.size >= MAX_ACTIVE_SYNC_REQUESTS) throw new CalendarSyncBusyError();

  active.add(key);
  activeSyncsByUser.set(userId, active);
  const task = performCalendarSync(userId, start, end);
  syncsInFlight.set(key, task);
  try {
    const result = await task;
    if (!result.errors.length && result.events.length) {
      successfulSyncCache.set(key, { expiresAt: Date.now() + SYNC_CACHE_TTL_MS, result });
      while (successfulSyncCache.size > MAX_SYNC_CACHE_ENTRIES) {
        const oldest = successfulSyncCache.keys().next().value;
        if (oldest === undefined) break;
        successfulSyncCache.delete(oldest);
      }
    }
    return result;
  } finally {
    syncsInFlight.delete(key);
    active.delete(key);
    if (!active.size) activeSyncsByUser.delete(userId);
  }
}

/** Invalidates cached event ranges after a user's provider connection changes. */
export function invalidateCalendarSyncCache(userId: string) {
  syncGenerationByUser.set(userId, (syncGenerationByUser.get(userId) ?? 0) + 1);
  for (const key of successfulSyncCache.keys()) if (key.startsWith(`${userId}:`)) successfulSyncCache.delete(key);
}

/** Fetches each provider's visible range and retains successful partial results. */
async function performCalendarSync(userId: string, start: string, end: string): Promise<CalendarSyncResult> {
  const connections = await prisma.calendarConnection.findMany({ where: { userId } }) as ProviderConnection[];
  const deadline = Date.now() + MAX_PROVIDER_SYNC_MS;
  const results = await Promise.all(connections.map(async (connection) => {
    try {
      const result = connection.provider === "GOOGLE"
        ? await fetchGoogleEvents(connection, start, end, deadline)
        : await fetchOutlookEvents(connection, start, end, deadline);
      return { provider: connection.provider, ...result, error: null as string | null };
    } catch (error) {
      console.error(`Calendar sync failed for ${connection.provider}:`, error);
      return {
        provider: connection.provider,
        events: [] as CalendarEvent[],
        warnings: [] as { provider: CalendarProvider; message: string }[],
        error: error instanceof Error ? error.message : "Could not synchronize this calendar. Check your connection and retry.",
      };
    }
  }));
  return {
    events: results.flatMap((result) => result.events).sort((a, b) => a.start.localeCompare(b.start)),
    errors: results.filter((result) => result.error).map(({ provider, error }) => ({ provider, message: error! })),
    warnings: results.flatMap((result) => result.warnings),
  };
}

/** Returns a display label for a supported calendar provider. */
export function calendarProviderName(provider: CalendarProvider) {
  return provider === "GOOGLE" ? "Google Calendar" : "Outlook";
}
