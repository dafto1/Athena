"use client";

// Orchestrator: wires together all timer sub-components.
// All logic lives in useTimer; all UI lives in focused child components.

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { useTimer } from "./use-timer";
import { TimerDisplay } from "./timer-display";
import { TimerControls } from "./timer-controls";
import { TimerDurationPicker } from "./timer-duration-picker";
import { TimerCompleteBanner } from "./timer-complete-banner";
import { SessionHistory } from "./session-history";

type SaveState = "idle" | "saving" | "saved" | "error";

export function PomodoroTimer() {
  const { status, secondsLeft, totalSeconds, durationMin, setDurationMin, start, pause, reset, startedAt } =
    useTimer(25);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [historyKey, setHistoryKey] = useState(0);
  const saveFired = useRef(false);

  // Save session when timer completes (REQ-TIMER-006)
  useEffect(() => {
    if (status !== "completed" || saveFired.current || !startedAt) return;
    saveFired.current = true;
    setSaveState("saving");

    fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMin, startedAt }),
    })
      .then((r) => {
        setSaveState(r.ok ? "saved" : "error");
        if (r.ok) setHistoryKey((k) => k + 1); // refresh history
      })
      .catch(() => setSaveState("error"));
  }, [status, startedAt, durationMin]);

  // Reset save state guard when user resets
  function handleReset() {
    reset();
    setSaveState("idle");
    saveFired.current = false;
  }

  const isLocked = status === "running" || status === "paused";

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      {/* ── Timer card ── */}
      <Card className="flex flex-col items-center py-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          {status === "idle" && "Ready"}
          {status === "running" && "Focusing…"}
          {status === "paused" && "Paused"}
          {status === "completed" && "Done!"}
        </p>

        <TimerDisplay
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          status={status}
        />

        <TimerDurationPicker
          current={durationMin}
          disabled={isLocked}
          onChange={setDurationMin}
        />

        <TimerControls
          status={status}
          onStart={start}
          onPause={pause}
          onReset={handleReset}
        />

        {(saveState === "saving" || saveState === "saved" || saveState === "error") && (
          <TimerCompleteBanner kind={saveState} />
        )}
      </Card>

      {/* ── Session history ── */}
      <SessionHistory refreshKey={historyKey} />
    </div>
  );
}
