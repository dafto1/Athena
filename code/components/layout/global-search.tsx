"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock3, FileText, LoaderCircle, Search, X, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";

type ResourceResult = { id: string; title: string; fileName: string; category: string; fileType: string };
type TaskResult = { id: string; title: string; description: string | null; dueDate: string | null; completed: boolean };
type EventResult = { id: string; provider: "GOOGLE" | "OUTLOOK"; title: string; start: string; allDay: boolean; url: string | null; location: string | null };
type Results = { resources: ResourceResult[]; tasks: TaskResult[]; events: EventResult[] };
type ResultItem = { kind: "resource" | "task" | "event"; id: string; title: string; detail: string; href?: string; external?: boolean };

function asMessage(error: unknown) {
  return error instanceof Error ? error.message : "Search could not be completed.";
}

export function GlobalSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ resources: [], tasks: [], events: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calendarError, setCalendarError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [shortcutActive, setShortcutActive] = useState(false);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        setShortcutActive(true);
        window.setTimeout(() => setShortcutActive(false), 1100);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      setCalendarError("");
      try {
        const encoded = encodeURIComponent(term);
        const contentSearch = fetch(`/api/search?query=${encoded}`, { cache: "no-store", signal: controller.signal })
          .then(async (response) => {
            const content = await response.json();
            if (!response.ok) throw new Error(content.message ?? "Could not search your resources and tasks.");
            if (!controller.signal.aborted) setResults((current) => ({ ...current, resources: content.resources ?? [], tasks: content.tasks ?? [] }));
          });
        const calendarSearch = fetch(`/api/calendar/events?query=${encoded}`, { cache: "no-store", signal: controller.signal })
          .then(async (response) => {
            const calendar = await response.json();
            if (!response.ok) throw new Error(calendar.message ?? "Could not search your calendar.");
            if (!controller.signal.aborted) setResults((current) => ({ ...current, events: calendar.events ?? [] }));
            if (calendar.errors?.length && !controller.signal.aborted) setCalendarError(calendar.errors[0].message);
          })
          .catch((calendarSearchError: unknown) => {
            if (!controller.signal.aborted) setCalendarError(asMessage(calendarSearchError));
          });
        await Promise.all([contentSearch, calendarSearch]);
      } catch (requestError) {
        if (!controller.signal.aborted) setError(asMessage(requestError));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const items: ResultItem[] = [
    ...results.resources.map((resource): ResultItem => ({ kind: "resource", id: resource.id, title: resource.title, detail: `${resource.category} · ${resource.fileName}`, href: `/dashboard/resources/${resource.id}` })),
    ...results.tasks.map((task): ResultItem => ({ kind: "task", id: task.id, title: task.title, detail: task.completed ? "Completed task" : task.dueDate ? `Due ${format(new Date(task.dueDate), "MMM d, yyyy")}` : "Task", href: `/dashboard/tasks?task=${encodeURIComponent(task.id)}` })),
    ...results.events.map((event): ResultItem => ({ kind: "event", id: event.id, title: event.title, detail: `${event.allDay ? "All day" : format(parseISO(event.start), "MMM d · h:mm a")} · ${event.provider === "GOOGLE" ? "Google Calendar" : "Outlook"}${event.location ? ` · ${event.location}` : ""}`, href: event.url ?? `/dashboard/calendar?event=${encodeURIComponent(event.id)}`, external: Boolean(event.url) })),
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const command = normalizedQuery === "resources" || normalizedQuery === "resource"
    ? { label: "Open resources", href: "/dashboard/resources", icon: FileText }
    : normalizedQuery === "calendar" || normalizedQuery === "events" || normalizedQuery === "event"
      ? { label: "Open calendar", href: "/dashboard/calendar", icon: CalendarDays }
      : null;

  const selectItem = useCallback((item: ResultItem) => {
    setOpen(false);
    if (item.external && item.href) window.open(item.href, "_blank", "noopener,noreferrer");
    else if (item.href) router.push(item.href);
  }, [router]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && command && activeIndex < 0) {
      event.preventDefault();
      setOpen(false);
      router.push(command.href);
      return;
    }
    if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => current <= 0 ? items.length - 1 : current - 1);
    } else if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      selectItem(items[activeIndex]);
    }
  }

  const sections = [
    { kind: "resource" as const, label: "Resources", values: results.resources },
    { kind: "task" as const, label: "Tasks", values: results.tasks },
    { kind: "event" as const, label: "Calendar events", values: results.events },
  ];

  return (
    <div ref={rootRef} className="relative z-30 w-full">
      <label htmlFor="athena-global-search" className="sr-only">Search resources, tasks, and calendar events</label>
      <div className={`group flex h-11 items-center gap-3 rounded-xl border bg-[#faf9f7] px-3.5 transition-all duration-200 ${open ? "border-stone-400 bg-white shadow-[0_4px_16px_rgba(41,37,36,0.09)] ring-2 ring-stone-200/70" : "border-[#e9e8e4] shadow-[0_1px_2px_rgba(41,37,36,0.04)] hover:border-stone-300 hover:bg-white"} ${shortcutActive ? "border-amber-400 bg-amber-50/70 ring-2 ring-amber-200" : ""}`}>
        <Search aria-hidden="true" className={`h-[17px] w-[17px] shrink-0 transition-colors ${shortcutActive ? "text-amber-700" : open ? "text-stone-700" : "text-stone-400 group-hover:text-stone-600"}`} />
        <input
          ref={inputRef}
          id="athena-global-search"
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search resources, tasks, events…"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="athena-search-results"
          className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#37352f] outline-none placeholder:font-normal placeholder:text-stone-400"
        />
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-stone-400" aria-label="Searching" /> : query ? (
          <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); setOpen(true); }} aria-label="Clear search" className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"><X className="h-4 w-4" /></button>
        ) : <kbd className={`hidden rounded-md border px-2 py-1 text-[10px] font-medium leading-none transition-colors sm:inline ${shortcutActive ? "border-amber-300 bg-amber-100 text-amber-800" : "border-stone-200 bg-white text-stone-400"}`}><span className="mr-1 opacity-70">Ctrl</span>K</kbd>}
      </div>

      {open && command && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">Quick navigation</p>
          <button type="button" onClick={() => { setOpen(false); router.push(command.href); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:outline-none">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-700"><command.icon className="h-4 w-4" /></span>
            <span className="flex-1"><span className="block text-sm font-semibold text-stone-800">{command.label}</span><span className="block text-xs text-stone-500">Go to the {normalizedQuery.includes("cal") || normalizedQuery === "event" || normalizedQuery === "events" ? "calendar" : "resources"} page</span></span>
            <ArrowRight className="h-4 w-4 text-stone-400" />
          </button>
          <p className="px-3 pb-1 pt-2 text-[10px] text-stone-400">Press Enter to open</p>
        </div>
      )}

      {open && query.trim().length >= 2 && !command && (
        <div id="athena-search-results" role="listbox" aria-label="Search results" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] max-h-[min(70vh,34rem)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl shadow-stone-900/10">
          {error ? <p role="alert" className="px-3 py-5 text-sm text-rose-700">{error}</p> : loading && !items.length ? <p className="px-3 py-5 text-sm text-stone-500">Searching your workspace…</p> : !items.length ? <p className="px-3 py-5 text-sm text-stone-500">No matches found for “{query.trim()}”.</p> : (
            <>
              {sections.map((section) => {
                const values = items.filter((item) => item.kind === section.kind);
                if (!values.length) return null;
                return <section key={section.kind} aria-label={section.label} className="py-1">
                  <h2 className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{section.label}</h2>
                  {values.map((item) => {
                    const index = items.indexOf(item);
                    const Icon = item.kind === "resource" ? FileText : item.kind === "task" ? (results.tasks.find((task) => task.id === item.id)?.completed ? Check : Clock3) : CalendarDays;
                    return <button key={`${item.kind}-${item.id}`} role="option" aria-selected={activeIndex === index} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => selectItem(item)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${activeIndex === index ? "bg-stone-100" : "hover:bg-stone-50"}`}>
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.kind === "resource" ? "bg-blue-50 text-blue-700" : item.kind === "task" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}><Icon aria-hidden="true" className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-stone-800">{item.title}</span><span className="mt-0.5 block truncate text-xs text-stone-500">{item.detail}</span></span>
                      {item.external && <span className="text-[10px] text-stone-400">↗</span>}
                    </button>;
                  })}
                </section>;
              })}
              {calendarError && <p role="status" className="mx-2 mt-1 border-t border-stone-100 px-2 pt-2 text-xs text-stone-500">Calendar events couldn’t be searched right now.</p>}
              <div className="mt-1 flex items-center justify-between border-t border-stone-100 px-3 pt-2 text-[10px] text-stone-400"><span>Use ↑ ↓ to navigate</span><span>Enter to open · Esc to close</span></div>
            </>
          )}
        </div>
      )}
      {open && query.trim().length < 2 && query.trim().length > 0 && <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-500 shadow-lg">Type at least 2 characters to search.</div>}
      <div className="sr-only" aria-live="polite">{loading ? "Searching" : `${items.length} results`}</div>
      <noscript><Link href="/dashboard/resources" className="sr-only">Browse resources</Link></noscript>
    </div>
  );
}
