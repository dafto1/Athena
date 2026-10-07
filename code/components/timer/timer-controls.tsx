// Start / Pause / Reset controls for the timer.

import { Button } from "@/components/ui";
import type { TimerStatus } from "./types";

export function TimerControls({
  status,
  onStart,
  onPause,
  onReset,
}: {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  const isRunning = status === "running";
  const isDone = status === "completed";

  return (
    <div className="mt-7 flex justify-center gap-3">
      {/* REQ-TIMER-002 */}
      <Button onClick={onStart} disabled={isRunning || isDone} variant="primary">
        {status === "paused" ? "Resume" : "Start"}
      </Button>

      {/* REQ-TIMER-003 */}
      <Button onClick={onPause} disabled={!isRunning} variant="secondary">
        Pause
      </Button>

      {/* REQ-TIMER-004 */}
      <Button onClick={onReset} variant="secondary">
        Reset
      </Button>
    </div>
  );
}
