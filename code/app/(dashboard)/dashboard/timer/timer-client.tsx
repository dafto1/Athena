"use client";

import { useEffect, useState } from "react";

export function Timer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessions((s) => s + 1);
      setTimeLeft(25 * 60);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Focus Timer</h1>
      <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
        <div className="text-7xl font-mono font-bold text-slate-900">{formatTime(timeLeft)}</div>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-32 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => { setIsRunning(false); setTimeLeft(25 * 60); }}
            className="w-32 rounded-lg border border-slate-300 px-4 py-2 font-semibold"
          >
            Reset
          </button>
        </div>
        <p className="mt-4 text-slate-600">Completed sessions: {sessions}</p>
      </div>
    </div>
  );
}