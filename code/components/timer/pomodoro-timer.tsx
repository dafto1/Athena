"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";

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
    setMessage(
      response.ok
        ? "Session complete — saved to your history."
        : "Session completed, but could not be saved."
    );
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
  const progress = (secondsLeft / INITIAL_SECONDS) * 100;

  return (
    <Card className="mt-8 max-w-md text-center">
      <p className="text-sm text-slate-500">25-minute focus session</p>

      {/* Progress bar */}
      <div className="my-4 h-1.5 w-full rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-violet-600 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p
        aria-live="polite"
        className="text-7xl font-bold tabular-nums tracking-tight text-slate-950"
      >
        {minutes}:{seconds}
      </p>

      <div className="mt-7 flex justify-center gap-3">
        <Button
          onClick={start}
          disabled={running || secondsLeft === 0}
          variant="primary"
        >
          Start
        </Button>
        <Button
          onClick={() => setRunning(false)}
          disabled={!running}
          variant="secondary"
        >
          Pause
        </Button>
        <Button onClick={reset} variant="secondary">
          Reset
        </Button>
      </div>

      {message && (
        <p className="mt-5 text-sm font-medium text-emerald-700">{message}</p>
      )}
    </Card>
  );
}
