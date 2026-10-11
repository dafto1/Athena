"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRef } from "react";
import { ArrowUp, CalendarPlus, Check, Plus, Sparkles, PanelLeftOpen, Timer } from "lucide-react";
import { NemoPomodoro } from "./nemo-pomodoro";

type NemoAction =
  | { type: "create_task"; title: string; description?: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; dueDate?: string | null }
  | { type: "record_focus_session"; durationMin: number; startedAt: string }
  | { type: "create_calendar_event"; provider: "GOOGLE" | "OUTLOOK"; title: string; start: string; end: string; description?: string | null; location?: string | null }
  | { type: "start_pomodoro"; durationMin: number }
  | { type: "create_task_calendar_event"; title: string; description?: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; dueDate?: string | null; provider: "GOOGLE" | "OUTLOOK"; start: string; end: string; location?: string | null };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; action?: NemoAction | null };
type Conversation = { id: string; title: string; updatedAt: string };

async function readApiJson<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    if (!response.ok) throw new Error(`${fallback} (HTTP ${response.status}).`);
    throw new Error("Nemo returned an incomplete response. Please try again.");
  }
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message
      : `${fallback} (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return data as T;
}

function AssistantText({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: Array<{ type: "heading" | "paragraph" | "list"; text?: string; level?: number; ordered?: boolean; items?: string[] }> = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", text: heading[2], level: heading[1].length });
      index += 1;
      continue;
    }

    const listItem = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (listItem) {
      const ordered = /^\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        const currentItem = current.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
        if (currentItem && /^\d+[.)]\s+/.test(current) === ordered) {
          items.push(currentItem[1]);
          index += 1;
          continue;
        }
        if (!current && lines.slice(index + 1).find((next) => next.trim())?.trim().match(/^(?:[-*+]\s+|\d+[.)]\s+)/)) {
          index += 1;
          continue;
        }
        break;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,4})\s+/.test(lines[index].trim()) && !/^(?:[-*+]\s+|\d+[.)]\s+)/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return <div className="space-y-4">{blocks.map((block, blockIndex) => {
    if (block.type === "heading") {
      const Heading = block.level === 1 ? "h2" : "h3";
      return <Heading key={blockIndex} className="pt-1 text-base font-semibold tracking-tight text-stone-900 first:pt-0">{inlineMarkdown(block.text ?? "")}</Heading>;
    }
    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul";
      return <List key={blockIndex} className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-5 marker:text-stone-400`}>{block.items?.map((item, itemIndex) => <li key={itemIndex} className="pl-1">{inlineMarkdown(item)}</li>)}</List>;
    }
    return <p key={blockIndex} className="leading-7">{inlineMarkdown(block.text ?? "")}</p>;
  })}</div>;
}

function inlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index} className="font-semibold text-stone-800">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>;
    return part;
  });
}

function ActionCard({ action, busy, onConfirm }: { action: NemoAction; busy: boolean; onConfirm: () => void }) {
  const details = action.type === "create_task"
    ? <><p className="font-medium">Create task: {action.title}</p><p className="mt-1 text-xs text-stone-500">{action.priority} priority{action.dueDate ? ` · Due ${new Date(action.dueDate).toLocaleDateString()}` : ""}</p></>
    : action.type === "record_focus_session"
      ? <><p className="font-medium">Record focus session</p><p className="mt-1 text-xs text-stone-500">{action.durationMin} minutes</p></>
      : action.type === "create_calendar_event"
        ? <><p className="font-medium">Create {action.provider === "GOOGLE" ? "Google" : "Outlook"} event: {action.title}</p><p className="mt-1 text-xs text-stone-500">{new Date(action.start).toLocaleString()} · {action.location || "No location"}</p></>
        : action.type === "create_task_calendar_event"
          ? <><p className="font-medium">Create task and calendar event: {action.title}</p><p className="mt-1 text-xs text-stone-500">{action.priority} priority · {new Date(action.start).toLocaleString()} · {action.provider === "GOOGLE" ? "Google Calendar" : "Outlook"}</p></>
          : <><p className="font-medium">Start a {action.durationMin}-minute Pomodoro?</p><p className="mt-1 text-xs text-stone-500">The timer will run in this chat and save a focus session when it finishes.</p></>;
  const buttonLabel = action.type === "start_pomodoro" ? "Start timer" : action.type === "create_task_calendar_event" ? "Create task and event" : "Confirm";
  const Icon = action.type === "start_pomodoro" ? Timer : action.type === "create_task_calendar_event" ? CalendarPlus : Check;
  return <div className="mt-4 rounded-xl border border-stone-200 bg-[#faf9f7] p-4">{details}<button disabled={busy} onClick={onConfirm} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-stone-800 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-50"><Icon size={14} /> {buttonLabel}</button></div>;
}

export function NemoChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyScrollTop = useRef(0);
  const startPomodoroRef = useRef<(minutes: number) => boolean>(() => false);
  const registerPomodoroStart = useCallback((start: (minutes: number) => boolean) => { startPomodoroRef.current = start; }, []);

  async function createConversation() {
    const response = await fetch("/api/nemo/conversations", { method: "POST" });
    const data = await readApiJson<Conversation>(response, "Could not start a chat.");
    setConversationId(data.id);
    setMessages([]);
    setConversations((current) => [{ id: data.id, title: data.title, updatedAt: data.updatedAt }, ...current]);
  }

  useEffect(() => {
    fetch("/api/nemo/conversations", { cache: "no-store" }).then((response) => readApiJson<Conversation[]>(response, "Could not load your chats.")).then(async (items) => {
      setConversations(items);
      if (items[0]) {
        setConversationId(items[0].id);
        const response = await fetch(`/api/nemo/conversations/${items[0].id}`, { cache: "no-store" });
        const conversation = await readApiJson<{ messages?: ChatMessage[] }>(response, "Could not load your chat.");
        setMessages(conversation.messages ?? []);
      }
    }).catch(() => setError("Could not load your chats."));
  }, []);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setBusy(true);
    setError("");
    try {
      let id = conversationId;
      if (!id) {
        const response = await fetch("/api/nemo/conversations", { method: "POST" });
        const conversation = await readApiJson<Conversation>(response, "Could not start a chat.");
        id = conversation.id;
        setConversationId(id);
      }
      setDraft("");
      const optimistic: ChatMessage = { id: `pending-${Date.now()}`, role: "user", content: message };
      setMessages((current) => [...current, optimistic]);
      const response = await fetch("/api/nemo/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: id, message }) });
      const result = await readApiJson<{ userMessage: ChatMessage; assistantMessage: ChatMessage }>(response, "Nemo could not reply.");
      setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), result.userMessage, result.assistantMessage]);
      const listResponse = await fetch("/api/nemo/conversations", { cache: "no-store" });
      if (listResponse.ok) setConversations(await readApiJson<Conversation[]>(listResponse, "Could not refresh your chats."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nemo could not reply.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAction(message: ChatMessage) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/nemo/chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: message.id }) });
      const result = await readApiJson<{ task?: { title: string }; session?: { durationMin: number }; event?: { title: string }; pomodoro?: { durationMin: number } }>(response, "Could not complete that action.");
      const timerStarted = result.pomodoro ? startPomodoroRef.current(result.pomodoro.durationMin) : false;
      const completion = result.pomodoro ? timerStarted ? `Started a ${result.pomodoro.durationMin}-minute Pomodoro in this chat.` : "A timer is already running, so I left it unchanged." : result.task && result.event ? `Created task “${result.task.title}” and added it to your calendar.` : result.task ? `Task created: ${result.task.title}.` : result.session ? `Focus session recorded: ${result.session.durationMin} minutes.` : result.event ? `Calendar event created: ${result.event.title}.` : "Action completed.";
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, action: null, content: `${item.content}\n\n${completion}` } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete that action.");
    } finally {
      setBusy(false);
    }
  }

  function selectConversation(id: string) {
    setConversationId(id);
    setMessages([]);
    fetch(`/api/nemo/conversations/${id}`, { cache: "no-store" }).then((response) => readApiJson<{ messages?: ChatMessage[] }>(response, "Could not load that chat.")).then((conversation) => setMessages(conversation.messages ?? [])).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load that chat."));
  }

  return (
    <section className="relative flex h-full min-h-[460px] w-full overflow-hidden bg-white text-stone-800">
      {historyOpen && <button aria-label="Close chat history" onClick={() => setHistoryOpen(false)} className="absolute inset-0 z-20 bg-black/20 sm:hidden" />}
      <aside className={`${historyOpen ? "translate-x-0" : "-translate-x-full"} absolute inset-y-0 left-0 z-30 flex w-[min(82vw,280px)] shrink-0 flex-col border-r border-stone-200 bg-transparent p-3 transition-transform sm:static sm:w-56 sm:translate-x-0 ${historyOpen ? "sm:flex" : "sm:flex"}`}>
        <p className="px-2 pb-2 pt-5 text-xs font-medium uppercase tracking-wide text-stone-500">Recent chats</p>
        <div onScroll={(event) => { historyScrollTop.current = event.currentTarget.scrollTop; }} ref={(element) => { if (element && element.scrollTop !== historyScrollTop.current) element.scrollTop = historyScrollTop.current; }} className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">{conversations.map((item) => <button key={item.id} onClick={() => { selectConversation(item.id); setHistoryOpen(false); }} className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${conversationId === item.id ? "bg-[#e9e8e4]" : "hover:bg-[#eeedea]"}`}>{item.title}</button>)}</div>
      </aside>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="relative z-20 flex h-12 shrink-0 items-center justify-between px-4 sm:px-6"><div className="flex items-center gap-2"><button onClick={() => setHistoryOpen((open) => !open)} aria-label="Toggle chat history" className="rounded-md p-2 text-stone-500 hover:bg-stone-100 sm:hidden"><PanelLeftOpen size={17} /></button><Sparkles className="h-4 w-4 text-stone-500" /><h1 className="text-sm font-semibold">Nemo</h1></div><div className="flex items-center gap-1"><NemoPomodoro registerStart={registerPomodoroStart} /><button onClick={() => createConversation().catch((cause) => setError(cause.message))} className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-stone-600 hover:bg-stone-100"><Plus size={16} /><span className="hidden sm:inline">New chat</span></button></div></header>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pb-28 pt-8 sm:px-10">
          {messages.length === 0 && <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-10 text-center"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#f7f6f3] text-stone-600"><Sparkles className="h-5 w-5" /></div><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What can I help with?</h2><p className="mt-3 max-w-md text-sm leading-6 text-stone-500">Ask about your tasks, resources, focus sessions, or connected calendar.</p><div className="mt-8 grid w-full max-w-xl gap-2 text-left sm:grid-cols-2">{["What should I focus on today?", "Summarize my upcoming deadlines", "Find a resource about…", "Help me plan a study session", "Start a 25-minute Pomodoro", "Add a to-do to my calendar"].map((suggestion) => <button key={suggestion} onClick={() => setDraft(suggestion)} className="rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-50">{suggestion}</button>)}</div></div>}
          {messages.map((message) => <article key={message.id} className={`mx-auto w-full max-w-3xl text-sm leading-7 ${message.role === "user" ? "flex justify-end" : ""}`}><div className={message.role === "user" ? "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[#f1f0ed] px-4 py-3 text-stone-800" : "max-w-full py-1 text-stone-700"}>{message.role === "assistant" ? <AssistantText content={message.content} /> : <p>{message.content}</p>}{message.action && <ActionCard action={message.action} busy={busy} onConfirm={() => confirmAction(message)} />}</div></article>)}
          {busy && <div role="status" aria-live="polite" className="mx-auto flex w-full max-w-3xl items-center gap-2.5 py-1 text-xs text-stone-500"><Sparkles className="h-4 w-4 animate-pulse text-amber-600" /><span>Nemo is thinking</span><span className="flex items-center gap-1" aria-hidden="true"><span className="h-1 w-1 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.2s]" /><span className="h-1 w-1 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.1s]" /><span className="h-1 w-1 animate-bounce rounded-full bg-stone-400" /></span></div>}
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
        <form onSubmit={send} className="absolute inset-x-0 bottom-0 z-10 shrink-0 bg-white px-4 pb-5 pt-3 sm:px-8"><div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-stone-300 bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.05)] focus-within:border-stone-400"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={4000} placeholder="Message Nemo…" className="max-h-32 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none placeholder:text-stone-400" /><button disabled={!draft.trim() || busy} aria-label="Send message" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-40"><ArrowUp size={17} /></button></div><p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-stone-400">Nemo can make mistakes. Review important information.</p></form>
      </div>
    </section>
  );
}
