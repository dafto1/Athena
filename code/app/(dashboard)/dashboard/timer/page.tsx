import { PomodoroTimer } from "@/components/timer/pomodoro-timer";
import { PageHeader } from "@/components/ui";

export default function TimerPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Deep work"
        title="Focus timer"
        description="Work in focused 25-minute blocks, then take a short break."
      />
      <PomodoroTimer />
    </div>
  );
}
