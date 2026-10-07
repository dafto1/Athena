"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_DURATION_MIN, MIN_DURATION_MIN, type TimerStatus } from "./types";

export type UseTimerReturn = {
  status: TimerStatus;
  secondsLeft: number;
  totalSeconds: number;
  durationMin: number;
  setDurationMin: (min: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  /** ISO string of when the session started, null if not started. */
  startedAt: string | null;
};

/**
 * Core timer hook. Encapsulates all countdown logic so UI components stay thin.
 * Exposes status, secondsLeft, controls, and the validated duration setter.
 */
export function useTimer(defaultDuration = 25): UseTimerReturn {
  const [durationMin, setDurationMinState] = useState(defaultDuration);
  const [secondsLeft, setSecondsLeft] = useState(defaultDuration * 60);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [startedAt, setStartedAt] = useState<string | null>(null);

  // Prevent re-entry when tick fires on 0
  const completionFired = useRef(false);

  const totalSeconds = durationMin * 60;

  // REQ-TIMER-008: Validate and reject invalid durations
  const setDurationMin = useCallback((min: number) => {
    if (!Number.isInteger(min) || min < MIN_DURATION_MIN || min > MAX_DURATION_MIN) return;
    setDurationMinState(min);
    setSecondsLeft(min * 60);
    setStatus("idle");
    setStartedAt(null);
    completionFired.current = false;
  }, []);

  // REQ-TIMER-001: Countdown tick
  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setStatus("completed");   // REQ-TIMER-005
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  // REQ-TIMER-002: Start
  const start = useCallback(() => {
    if (status === "completed" || secondsLeft === 0) return;
    if (!startedAt) setStartedAt(new Date().toISOString());
    setStatus("running");
  }, [status, secondsLeft, startedAt]);

  // REQ-TIMER-003: Pause
  const pause = useCallback(() => {
    if (status !== "running") return;
    setStatus("paused");
  }, [status]);

  // REQ-TIMER-004: Reset
  const reset = useCallback(() => {
    setStatus("idle");
    setSecondsLeft(durationMin * 60);
    setStartedAt(null);
    completionFired.current = false;
  }, [durationMin]);

  return { status, secondsLeft, totalSeconds, durationMin, setDurationMin, start, pause, reset, startedAt };
}
