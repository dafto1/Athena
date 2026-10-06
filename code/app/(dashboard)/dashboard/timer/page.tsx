import { PomodoroTimer } from "@/components/timer/pomodoro-timer";

export default function TimerPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Deep work</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Focus timer</h1>
      <PomodoroTimer />
    </div>
  );
}
