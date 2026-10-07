// Renders the circular progress ring + MM:SS countdown.

import type { TimerStatus } from "./types";

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerDisplay({
  secondsLeft,
  totalSeconds,
  status,
}: {
  secondsLeft: number;
  totalSeconds: number;
  status: TimerStatus;
}) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const ringColor =
    status === "completed"
      ? "stroke-emerald-500"
      : status === "paused"
      ? "stroke-amber-400"
      : "stroke-violet-600";

  return (
    <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
      <svg className="-rotate-90" width="208" height="208" aria-hidden="true">
        {/* Track */}
        <circle
          cx="104" cy="104" r={RADIUS}
          className="stroke-slate-100"
          strokeWidth="10" fill="none"
        />
        {/* Progress */}
        <circle
          cx="104" cy="104" r={RADIUS}
          className={`${ringColor} transition-all duration-1000`}
          strokeWidth="10" fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <p
        aria-live="polite"
        className="absolute text-5xl font-bold tabular-nums tracking-tight text-slate-950"
      >
        {mm}:{ss}
      </p>
    </div>
  );
}
