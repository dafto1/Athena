// Shared types for all timer components

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export type StudySession = {
  id: string;
  durationMin: number;
  startedAt: string;
  completedAt: string;
};

/** Minimum and maximum allowed session durations (in minutes). */
export const MIN_DURATION_MIN = 1;
export const MAX_DURATION_MIN = 180;
