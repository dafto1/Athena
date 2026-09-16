"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MINUTES = 25;
const INITIAL_SECONDS = DURATION_MINUTES * 60;

export function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const savedCompletion = useRef(false);

  useEffect(() => {
    if (!running || secondsLeft === 0) return;
    const timerId = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearInterval(timerId);
  }, [running, secondsLeft]);

  useEffect(() => {
    if (secondsLeft !== 0 || savedCompletion.current || !startedAt) return;
    savedCompletion.current = true;
    setRunning(false);
    void fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durationMin: DURATION_MINUTES, startedAt }) })
      .then((response) => setMessage(response.ok ? "Session complete — saved to your history." : "Session completed, but could not be saved."));
  }, [secondsLeft, startedAt]);

  function start() { if (!startedAt) setStartedAt(new Date().toISOString()); setRunning(true); }
  function reset() { setRunning(false); setSecondsLeft(INITIAL_SECONDS); setStartedAt(null); setMessage(""); savedCompletion.current = false; }
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return <div className="mt-8 max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p className="text-slate-600">25 minute focus session</p><p aria-live="polite" className="mt-4 text-7xl font-bold tabular-nums">{minutes}:{seconds}</p><div className="mt-7 flex justify-center gap-3"><button onClick={start} disabled={running || secondsLeft === 0} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Start</button><button onClick={() => setRunning(false)} disabled={!running} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:opacity-50">Pause</button><button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold">Reset</button></div>{message && <p className="mt-5 text-sm text-slate-600">{message}</p>}</div>;
}
