"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { ArrowLeft, ArrowRight, CalendarDays, ExternalLink, RefreshCw, Unlink } from "lucide-react";
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

const PROVIDERS: { id: Provider; name: string; detail: string; accent: string }[] = [
  { id: "GOOGLE", name: "Google Calendar", detail: "Read your calendar events", accent: "bg-blue-600" },
  { id: "OUTLOOK", name: "Outlook", detail: "Read your Outlook events", accent: "bg-sky-700" },
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function providerPath(provider: Provider) {
  return provider.toLowerCase();
}

function eventDate(event: CalendarEvent) {
  return parseISO(event.start);
}

function eventTime(event: CalendarEvent) {
  if (event.allDay) return "All day";
  const start = format(eventDate(event), "h:mm a");
  const end = format(parseISO(event.end), "h:mm a");
  return `${start} – ${end}`;
}

function connectionMessage(value: string | undefined) {
  if (value === "connected") return "Calendar connected. Events are synchronizing.";
  if (value === "denied") return "Calendar access was not granted. You can try again whenever you’re ready.";
  if (value === "not-configured") return "This calendar provider is not configured yet. Ask your Athena administrator to add its OAuth credentials.";
  if (value === "failed") return "Athena could not complete the calendar connection. Please try again.";
  return "";
}

export function CalendarView({ initialNotice = "" }: { initialNotice?: string }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [connections, setConnections] = useState<Connection[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [issues, setIssues] = useState<SyncIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const [disconnecting, setDisconnecting] = useState<Provider | null>(null);

  const range = useMemo(() => ({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  }), [month]);
  const days = useMemo(() => eachDayOfInterval(range), [range]);

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

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ start: range.start.toISOString(), end: range.end.toISOString() });
      const response = await fetch(`/api/calendar/events?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Calendar synchronization could not be completed.");
      setEvents(result.events ?? []);
      setIssues(result.errors ?? []);
    } catch (error) {
      setIssues([{ provider: null, message: error instanceof Error ? error.message : "Calendar synchronization could not be completed. Please retry." }]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  async function disconnect(provider: Provider) {
    setDisconnecting(provider);
    setConnectionError("");
    try {
      const response = await fetch(`/api/calendar/connections/${providerPath(provider)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not disconnect this calendar. Please retry.");
      setConnections((current) => current.filter((item) => item.provider !== provider));
      setEvents((current) => current.filter((event) => event.provider !== provider));
      setIssues((current) => current.filter((item) => item.provider !== provider));
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Could not disconnect this calendar.");
    } finally {
      setDisconnecting(null);
    }
  }

  const eventsForDay = (day: Date) => events.filter((event) => isSameDay(eventDate(event), day));
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

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-950">Calendar connections</h2>
            <p className="mt-1 text-sm text-slate-600">Choose a provider and grant read-only access to sync your events.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void loadEvents()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Sync now
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROVIDERS.map((provider) => {
            const connected = connections.find((item) => item.provider === provider.id);
            return (
              <div key={provider.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${provider.accent}`}><CalendarDays className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{provider.name}</p>
                    <p className="text-xs text-slate-500">{connected ? `Connected ${format(parseISO(connected.connectedAt), "MMM d, yyyy")}` : provider.detail}</p>
                  </div>
                </div>
                {connected ? (
                  <Button variant="secondary" size="sm" onClick={() => void disconnect(provider.id)} disabled={disconnecting === provider.id}>
                    <Unlink className="h-4 w-4" /> {disconnecting === provider.id ? "Disconnecting" : "Disconnect"}
                  </Button>
                ) : (
                  <a href={`/api/calendar/connect/${providerPath(provider.id)}`} className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700">Connect</a>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{format(month, "MMMM yyyy")}</h2>
            <p className="text-sm text-slate-500">{loading ? "Synchronizing events…" : `${events.length} synchronized ${events.length === 1 ? "event" : "events"}`}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMonth((current) => subMonths(current, 1))} aria-label="Previous month"><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="secondary" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>Today</Button>
            <Button variant="secondary" size="sm" onClick={() => setMonth((current) => addMonths(current, 1))} aria-label="Next month"><ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {WEEKDAYS.map((weekday) => <div key={weekday} className="px-1 py-2 text-center text-xs font-semibold text-slate-500 sm:px-3">{weekday}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsForDay(day);
            return (
              <div key={day.toISOString()} className={`min-h-24 border-b border-r border-slate-200 p-1.5 sm:min-h-32 sm:p-2 ${isSameMonth(day, month) ? "bg-white" : "bg-slate-50/70"}`}>
                <div className={`mb-1 grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${isToday(day) ? "bg-violet-600 text-white" : isSameMonth(day, month) ? "text-slate-700" : "text-slate-400"}`}>{format(day, "d")}</div>
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
        {!loading && events.length === 0 && connections.length === 0 && (
          <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">Connect a calendar above to see your synchronized academic schedule here.</p>
        )}
      </Card>
    </div>
  );
}
