"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ArrowLeft, ArrowRight, ExternalLink, RefreshCw, Unlink } from "lucide-react";
import { Button, Card, ErrorBanner } from "@/components/ui";

type Provider = "GOOGLE" | "OUTLOOK";
type Connection = { provider: Provider; connectedAt: string };
type CalendarEvent = {
  id: string;
  provider: Provider;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  url: string | null;
  location: string | null;
};
type SyncIssue = { provider: Provider | null; message: string };
type SyncWarning = { provider: Provider; message: string };

const PROVIDERS: { id: Provider; name: string }[] = [
  { id: "GOOGLE", name: "Google Calendar" },
  { id: "OUTLOOK", name: "Outlook" },
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ProviderLogo({ provider }: { provider: Provider }) {
  if (provider === "GOOGLE") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#fff" stroke="#dadce0" />
      <path d="M6 4h12a3 3 0 0 1 3 3v2H3V7a3 3 0 0 1 3-3Z" fill="#4285f4" />
      <path d="M3 9h5v9a3 3 0 0 1-3 3h-2Z" fill="#34a853" />
      <path d="M16 9h5v9a3 3 0 0 1-3 3h-2Z" fill="#fbbc04" />
      <path d="M8 9h8v12H8Z" fill="#fff" />
      <path d="M16 9h5v2h-5Z" fill="#ea4335" />
      <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="700" fill="#4285f4">31</text>
    </svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <rect x="8" y="3" width="13" height="18" rx="2" fill="#0078d4" />
    <path d="m9 8 5.5 4L20 8v8l-5.5-4L9 16Z" fill="#fff" />
    <rect x="2" y="6" width="11" height="12" rx="2" fill="#0a5fa8" />
    <text x="7.5" y="14.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">O</text>
  </svg>;
}

/** Converts an internal provider value into its API route segment. */
function providerPath(provider: Provider) {
  return provider.toLowerCase();
}

/** Parses the normalized start value used by the calendar grid. */
function eventDate(event: CalendarEvent) {
  return parseISO(event.start);
}

/** Formats an event's start and end values for accessible titles. */
function eventTime(event: CalendarEvent) {
  if (event.allDay) return "All day";
  const start = format(eventDate(event), "h:mm a");
  const end = format(parseISO(event.end), "h:mm a");
  return `${start} – ${end}`;
}

/** Maps OAuth callback results to user-facing status messages. */
function connectionMessage(value: string | undefined) {
  if (value === "connected") return "Calendar connected. Events are synchronizing.";
  if (value === "denied") return "Calendar access was not granted. You can try again whenever you’re ready.";
  if (value === "not-configured") return "This calendar provider is not configured yet. Ask your Athena administrator to add its OAuth credentials.";
  if (value === "failed") return "Athena could not complete the calendar connection. Please try again.";
  return "";
}

/** Renders provider controls and a race-safe monthly event calendar. */
export function CalendarView({ initialNotice = "" }: { initialNotice?: string }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [connections, setConnections] = useState<Connection[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [issues, setIssues] = useState<SyncIssue[]>([]);
  const [warnings, setWarnings] = useState<SyncWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const [disconnecting, setDisconnecting] = useState<Provider | null>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const eventRequestId = useRef(0);
  const eventController = useRef<AbortController | null>(null);

  const range = useMemo(() => ({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  }), [month]);
  const rangeKey = `${range.start.toISOString()}:${range.end.toISOString()}`;
  const days = useMemo(() => eachDayOfInterval(range), [range]);
  const [loadedRangeKey, setLoadedRangeKey] = useState("");

  /** Loads only connection metadata; provider tokens remain on the server. */
  const loadConnections = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/connections", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load calendar connections.");
      setConnections(await response.json());
      setConnectionError("");
    } catch {
      setConnectionError("Calendar connections could not be loaded. Other Athena features remain available.");
    }
  }, []);

  /** Loads the current visible range and discards responses for stale ranges. */
  const loadEvents = useCallback(async () => {
    eventController.current?.abort();
    const controller = new AbortController();
    eventController.current = controller;
    const requestId = ++eventRequestId.current;
    setLoading(true);
    setEvents([]);
    setIssues([]);
    setWarnings([]);
    try {
      const params = new URLSearchParams({ start: range.start.toISOString(), end: range.end.toISOString() });
      const response = await fetch(`/api/calendar/events?${params}`, { cache: "no-store", signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Calendar synchronization could not be completed.");
      if (requestId !== eventRequestId.current) return;
      setEvents(result.events ?? []);
      setIssues(result.errors ?? []);
      setWarnings(result.warnings ?? []);
      setLoadedRangeKey(rangeKey);
    } catch (error) {
      if (controller.signal.aborted || requestId !== eventRequestId.current) return;
      setIssues([{ provider: null, message: error instanceof Error ? error.message : "Calendar synchronization could not be completed. Please retry." }]);
      setLoadedRangeKey(rangeKey);
    } finally {
      if (requestId === eventRequestId.current) setLoading(false);
    }
  }, [range, rangeKey]);

  /** Fetches the user's connected provider list when the calendar view loads. */
  useEffect(() => {
    const timer = window.setTimeout(() => void loadConnections(), 0);
    return () => window.clearTimeout(timer);
  }, [loadConnections]);

  /** Refreshes events when the visible month changes and aborts obsolete requests. */
  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvents(), 0);
    return () => {
      window.clearTimeout(timer);
      eventController.current?.abort();
    };
  }, [loadEvents]);

  /** Removes a provider connection and its events from the current view. */
  async function disconnect(provider: Provider) {
    setDisconnecting(provider);
    setConnectionError("");
    try {
      const response = await fetch(`/api/calendar/connections/${providerPath(provider)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not disconnect this calendar. Please retry.");
      setConnections((current) => current.filter((item) => item.provider !== provider));
      setEvents((current) => current.filter((event) => event.provider !== provider));
      setIssues((current) => current.filter((item) => item.provider !== provider));
      setWarnings((current) => current.filter((item) => item.provider !== provider));
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Could not disconnect this calendar.");
    } finally {
      setDisconnecting(null);
    }
  }

  /** Selects the events that begin on a particular calendar day. */
  const displayedEvents = loadedRangeKey === rangeKey ? events : [];
  const eventsForDay = (day: Date) => displayedEvents.filter((event) => isSameDay(eventDate(event), day));
  const notice = connectionMessage(initialNotice);

  return (
    <div className="space-y-6">
      {notice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{notice}</p>}
      {connectionError && <ErrorBanner message={connectionError} onDismiss={() => setConnectionError("")} />}
      {issues.map((issue) => (
        <div key={`${issue.provider ?? "calendar"}-${issue.message}`} role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span>{issue.provider ? `${PROVIDERS.find((item) => item.id === issue.provider)?.name}: ` : "Calendar: "}{issue.message}</span>
          <Button variant="secondary" size="sm" onClick={() => void loadEvents()} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> Retry sync
          </Button>
        </div>
      ))}
      {warnings.map((warning) => (
        <p key={`${warning.provider}-${warning.message}`} role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {PROVIDERS.find((provider) => provider.id === warning.provider)?.name}: {warning.message}
        </p>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setAccountsOpen((open) => !open)} aria-expanded={accountsOpen} aria-label="Show calendar connection settings">
          {PROVIDERS.map((provider) => {
            const connected = connections.some((item) => item.provider === provider.id);
            return (
              <span key={provider.id} className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-600">
                <ProviderLogo provider={provider.id} />
                <span>{provider.id === "GOOGLE" ? "Google" : "Outlook"}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden="true" />
                <span>{connected ? "Connected" : "Not connected"}</span>
              </span>
            );
          })}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void loadEvents()} disabled={loading} aria-label="Sync calendars">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {accountsOpen && <Card className="grid gap-3 sm:grid-cols-2">
          {PROVIDERS.map((provider) => {
            const connected = connections.find((item) => item.provider === provider.id);
            return (
              <div key={provider.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <ProviderLogo provider={provider.id} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{provider.name}</p>
                    <p className="text-xs text-slate-500">{connected ? `Connected ${format(parseISO(connected.connectedAt), "MMM d, yyyy")}` : "Not connected"}</p>
                  </div>
                </div>
                {connected ? (
                  <Button variant="secondary" size="sm" onClick={() => void disconnect(provider.id)} disabled={disconnecting === provider.id}>
                    <Unlink className="h-4 w-4" /> {disconnecting === provider.id ? "Disconnecting" : "Disconnect"}
                  </Button>
                ) : (
                  <a href={`/api/calendar/connect/${providerPath(provider.id)}`} className="shrink-0 rounded-lg bg-stone-600 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-700">Connect</a>
                )}
              </div>
            );
          })}
      </Card>}

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <h2 className="mr-1 text-lg font-bold text-slate-950">{format(month, "MMMM yyyy")}</h2>
            <Button variant="secondary" size="sm" onClick={() => setMonth((current) => subMonths(current, 1))} aria-label="Previous month"><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="secondary" size="sm" onClick={() => setMonth((current) => addMonths(current, 1))} aria-label="Next month"><ArrowRight className="h-4 w-4" /></Button>
          </div>
          <span className="text-sm font-medium text-slate-600">{format(new Date(), "EEE, MMM d")}</span>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {WEEKDAYS.map((weekday) => <div key={weekday} className="px-1 py-2 text-center text-xs font-semibold text-slate-500 sm:px-3">{weekday}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsForDay(day);
            return (
              <div key={day.toISOString()} className={`min-h-24 border-b border-r border-slate-200 p-1.5 sm:min-h-32 sm:p-2 ${isSameMonth(day, month) ? "bg-white" : "bg-slate-50/70"}`}>
                <div className={`mb-1 grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${isToday(day) ? "bg-stone-600 text-white" : isSameMonth(day, month) ? "text-slate-700" : "text-slate-400"}`}>{format(day, "d")}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <a key={event.id} href={event.url ?? undefined} target={event.url ? "_blank" : undefined} rel={event.url ? "noreferrer" : undefined} title={`${eventTime(event)} · ${event.title}${event.location ? ` · ${event.location}` : ""}`} className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium sm:text-xs ${event.provider === "GOOGLE" ? "bg-blue-100 text-blue-900" : "bg-sky-100 text-sky-950"}`}>
                      <span className="hidden sm:inline">{event.allDay ? "" : `${format(eventDate(event), "h:mm a")} `}</span>{event.title}
                      {event.url && <ExternalLink className="ml-1 inline h-3 w-3" />}
                    </a>
                  ))}
                  {dayEvents.length > 3 && <p className="px-1 text-[10px] text-slate-500">+{dayEvents.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
        {!loading && loadedRangeKey === rangeKey && displayedEvents.length === 0 && connections.length === 0 && (
          <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">Connect a calendar above to see your synchronized academic schedule here.</p>
        )}
      </Card>
    </div>
  );
}
