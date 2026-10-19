"use client";

import { Fragment, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpen, CalendarPlus, CheckSquare2, LoaderCircle, Sparkles, Timer } from "lucide-react";

type Activity = { tool: string; detail: string };
type Message = { role: "user" | "nemo"; text: string; activities?: Activity[] };
const starters = [
  { icon: BookOpen, label: "Ask my resources", prompt: "What are the key concepts in my uploaded resources?" },
  { icon: CheckSquare2, label: "Plan my tasks", prompt: "Show my open tasks and help me plan them." },
  { icon: CalendarPlus, label: "Schedule a session", prompt: "Help me schedule a study session on my calendar." },
  { icon: Timer, label: "Start a focus sprint", prompt: "Start a 25 minute focus timer." },
];

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index} className="font-semibold text-[#2e2c28]">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index} className="rounded bg-[#f0ede8] px-1.5 py-0.5 text-[0.82em] text-[#5e5140]">{part.slice(1, -1)}</code>;
    return <Fragment key={index}>{part}</Fragment>;
  })}</>;
}

function NemoResponse({ text }: { text: string }) {
  const normalised = text.replace(/\s+(?=(?:[1-9]\d*)\.\s+\*\*)/g, "\n");
  const lines = normalised.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const content: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushList = () => {
    if (!list) return;
    const List = list.ordered ? "ol" : "ul";
    content.push(<List key={`list-${content.length}`} className={list.ordered ? "my-3 list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[#a06b30]" : "my-3 list-disc space-y-1.5 pl-5 marker:text-[#a06b30]"}>{list.items.map((item, index) => <li key={index}><InlineText text={item} /></li>)}</List>);
    list = null;
  };
  lines.forEach((line) => {
    const match = line.match(/^(?:(\d+)\.|[-*])\s+(.+)$/);
    if (match) { const ordered = Boolean(match[1]); if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; } list.items.push(match[2]); return; }
    flushList(); content.push(<p key={`text-${content.length}`} className="leading-7"><InlineText text={line} /></p>);
  });
  flushList();
  return <div className="space-y-2">{content}</div>;
}

export function NemoWorkspace() {
  const [messages, setMessages] = useState<Message[]>([{ role: "nemo", text: "I’m Nemo. I can read your study resources, organise tasks, create calendar events, and open a focus timer. What are we working on?" }]);
  const [input, setInput] = useState(""); const [pending, setPending] = useState(false); const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);
  async function submit(event?: FormEvent, preset?: string) {
    event?.preventDefault(); const text = (preset ?? input).trim(); if (!text || pending) return;
    setMessages((items) => [...items, { role: "user", text }]); setInput(""); setPending(true);
    try { const response = await fetch("/api/nemo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history: messages.map(({ role, text: turn }) => ({ role, text: turn })) }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.message ?? "Nemo could not respond."); setMessages((items) => [...items, { role: "nemo", text: body.answer, activities: body.activities }]); if (body.timerMinutes) window.dispatchEvent(new CustomEvent("nemo:start-focus", { detail: body.timerMinutes })); }
    catch (error) { setMessages((items) => [...items, { role: "nemo", text: error instanceof Error ? error.message : "Nemo could not respond. Please try again." }]); }
    finally { setPending(false); }
  }
  return <section className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-5xl flex-col px-4 pb-8 sm:px-8">
    <header className="grid gap-5 border-b border-[#e9e8e4] pb-7 sm:grid-cols-[1fr_auto] sm:items-end">
      <div><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.19em] text-[#a06b30]"><Sparkles className="h-3.5 w-3.5" /> Agent workspace</div><h1 className="font-space-stitch text-4xl font-semibold tracking-[-0.04em] text-[#292825] sm:text-5xl">Nemo</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#787774]">A grounded study agent with access to your Athena workspace.</p></div>
      <div className="rounded-full border border-[#d8d5ce] bg-[#faf9f7] px-3 py-1.5 text-xs font-medium text-[#5f5e5b]"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#799b64]" />Tools ready</div>
    </header>
    <div className="flex flex-1 flex-col py-7"><div className="flex-1 space-y-6" aria-live="polite">
      {messages.map((message, index) => <div key={index} className={message.role === "user" ? "ml-auto max-w-[85%] sm:max-w-[70%]" : "max-w-3xl"}>
        {message.role === "nemo" && <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#a06b30]"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#f3e9dc]"><Sparkles className="h-3.5 w-3.5" /></span>Nemo</div>}
        <div className={message.role === "user" ? "rounded-2xl rounded-br-md bg-[#37352f] px-5 py-3.5 text-sm leading-6 text-white shadow-sm" : "rounded-r-2xl border border-[#ebe6de] border-l-[3px] border-l-[#d8c5ae] bg-[#fffefd] px-5 py-4 text-sm text-[#37352f] shadow-[0_8px_22px_-22px_rgba(41,40,37,0.55)]"}>{message.role === "nemo" ? <NemoResponse text={message.text} /> : message.text}</div>
        {!!message.activities?.length && <div className="mt-3 flex flex-wrap gap-2">{message.activities.map((activity) => <span key={`${activity.tool}-${activity.detail}`} className="rounded-md border border-[#e6e2db] bg-[#faf9f7] px-2 py-1 text-xs text-[#6b6964]"><b className="font-semibold text-[#4e4c47]">{activity.tool}</b> · {activity.detail}</span>)}</div>}
      </div>)}
      {pending && <div className="flex items-center gap-2 text-sm text-[#787774]"><LoaderCircle className="h-4 w-4 animate-spin" />Nemo is working…</div>}<div ref={endRef} />
    </div>
    {messages.length === 1 && <div className="mt-7 grid gap-2 sm:grid-cols-2">{starters.map(({ icon: Icon, label, prompt }) => <button key={label} type="button" onClick={() => submit(undefined, prompt)} className="group flex items-center gap-3 rounded-xl border border-[#e9e8e4] bg-[#faf9f7] p-3 text-left text-sm text-[#5f5e5b] transition hover:-translate-y-0.5 hover:border-[#cfc8bd] hover:bg-white"><Icon className="h-4 w-4 text-[#a06b30]" />{label}<span className="ml-auto opacity-0 transition group-hover:opacity-100">↗</span></button>)}</div>}
    </div>
    <form onSubmit={(event) => submit(event)} className="sticky bottom-3 flex gap-2 rounded-2xl border border-[#dcd7ce] bg-white p-2 shadow-[0_12px_35px_-18px_rgba(41,40,37,0.35)]"><label className="sr-only" htmlFor="nemo-message">Message Nemo</label><textarea id="nemo-message" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} rows={1} maxLength={2000} placeholder="Ask Nemo to search, organise, schedule, or focus…" className="min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm text-[#37352f] outline-none placeholder:text-[#aaa7a0]" /><button type="submit" disabled={!input.trim() || pending} aria-label="Send message" className="grid h-10 w-10 place-items-center rounded-xl bg-[#37352f] text-white transition hover:bg-[#54514b] disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button></form>
  </section>;
}
