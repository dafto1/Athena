"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useTimer } from "@/components/timer/use-timer";

type NemoPomodoroProps = { registerStart: (start: (minutes: number) => boolean) => void };

export function NemoPomodoro({ registerStart }: NemoPomodoroProps) {
  const timer = useTimer(25);
  const [open, setOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const saveFired = useRef(false);

  const startFor = useCallback((minutes: number) => {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return false;
    if (timer.status === "running" || timer.status === "paused") return false;
    timer.start(minutes);
    saveFired.current = false;
    setSaveMessage("");
    setOpen(true);
    return true;
  }, [timer.start, timer.status]);

  useEffect(() => registerStart(startFor), [registerStart, startFor]);

  useEffect(() => {
    if (timer.status !== "completed" || saveFired.current || !timer.startedAt) return;
    saveFired.current = true;
    fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMin: timer.durationMin, startedAt: timer.startedAt }),
    }).then((response) => {
      setSaveMessage(response.ok ? "Focus session saved." : "Timer finished, but the session could not be saved.");
    }).catch(() => setSaveMessage("Timer finished, but the session could not be saved."));
  }, [timer.durationMin, timer.startedAt, timer.status]);

  const minutes = String(Math.floor(timer.secondsLeft / 60)).padStart(2, "0");
  const seconds = String(timer.secondsLeft % 60).padStart(2, "0");
  const active = timer.status === "running" || timer.status === "paused";

  function resetTimer() {
    timer.reset();
    saveFired.current = false;
    setSaveMessage("");
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label="Toggle Pomodoro timer" className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition ${active ? "bg-amber-50 text-amber-800 hover:bg-amber-100" : "text-stone-600 hover:bg-stone-100"}`}>
        <Timer size={16} />
        <span className="hidden sm:inline">{active ? `${minutes}:${seconds}` : "Focus timer"}</span>
      </button>
      {open && <div aria-label="Pomodoro timer" className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-4 shadow-xl shadow-stone-900/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-800"><Clock3 size={16} className="text-amber-700" /> Pomodoro</div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close timer" className="rounded-md px-2 py-1 text-xs text-stone-500 hover:bg-stone-100">Close</button>
        </div>
        <p className="mt-1 text-xs text-stone-500">{timer.status === "running" ? "Focusing" : timer.status === "paused" ? "Paused" : timer.status === "completed" ? "Session complete" : "Choose a focus interval"}</p>
        <div data-testid="pomodoro-countdown" aria-label={`Time remaining ${minutes}:${seconds}`} aria-live="polite" className={`py-4 text-center text-4xl font-semibold tabular-nums tracking-tight ${timer.status === "completed" ? "text-emerald-700" : "text-stone-900"}`}>{minutes}:{seconds}</div>
        <div className="flex justify-center gap-2" aria-label="Focus duration">
          {[15, 25, 45].map((duration) => <button key={duration} type="button" disabled={active} onClick={() => timer.setDurationMin(duration)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${timer.durationMin === duration ? "border-amber-300 bg-amber-50 text-amber-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}>{duration} min</button>)}
        </div>
        <div className="mt-4 flex gap-2">
          {timer.status === "running"
            ? <button type="button" onClick={timer.pause} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-stone-800 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700"><Pause size={14} /> Pause</button>
            : <button type="button" disabled={timer.status === "completed"} onClick={() => timer.start()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-stone-800 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-50"><Play size={14} /> {timer.status === "paused" ? "Resume" : "Start"}</button>}
          <button type="button" onClick={resetTimer} className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"><RotateCcw size={14} /> Reset</button>
        </div>
        {saveMessage && <p role="status" className="mt-3 flex items-center gap-1.5 text-xs text-stone-500"><Check size={13} /> {saveMessage}</p>}
      </div>}
    </div>
  );
}
