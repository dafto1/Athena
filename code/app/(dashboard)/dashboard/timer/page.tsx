import { PomodoroTimer } from "@/components/timer/pomodoro-timer";
import { PageHeader } from "@/components/ui";

export default function TimerPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="" title="Focus Timer" />
      <PomodoroTimer />
    </div>
  );
}
