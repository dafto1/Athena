"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DURATION_MINUTES = 25;
const INITIAL_SECONDS = DURATION_MINUTES * 60;

export function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const savedCompletion = useRef(false);

  const finishSession = useCallback(async () => {
    setRunning(false);
    if (!startedAt || savedCompletion.current) return;
    savedCompletion.current = true;
    const response = await fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMin: DURATION_MINUTES, startedAt }),
    });
    setMessage(response.ok ? "Session complete — saved to your history." : "Session completed, but could not be saved.");
  }, [startedAt]);

  useEffect(() => {
    if (!running || secondsLeft === 0) return;
    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          void finishSession();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [finishSession, running, secondsLeft]);

  function start() {
    if (!startedAt) setStartedAt(new Date().toISOString());
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
    setStartedAt(null);
    setMessage("");
    savedCompletion.current = false;
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return <div className="mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-slate-600">25 minute focus session</p><p aria-live="polite" className="mt-4 text-7xl font-bold tabular-nums text-slate-950">{minutes}:{seconds}</p><div className="mt-7 flex justify-center gap-3"><button onClick={start} disabled={running || secondsLeft === 0} className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Start</button><button onClick={() => setRunning(false)} disabled={!running} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:opacity-50">Pause</button><button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold">Reset</button></div>{message && <p className="mt-5 text-sm text-slate-600">{message}</p>}</div>;
}
