import { prisma } from "@/lib/prisma"; 
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ListTodo } from "lucide-react";

export default async function DashboardPage() { 
  const user = await getCurrentUser(); 
  if (!user) redirect("/login");

  const [pendingTasks, completedTasks, sessions, nextTask] = await Promise.all([
    prisma.task.count({ where: { userId: user.id, completed: false } }),
    prisma.task.count({ where: { userId: user.id, completed: true } }),
    prisma.studySession.count({ where: { userId: user.id } }),
    prisma.task.findFirst({
      where: { userId: user.id, completed: false },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: { title: true, dueDate: true, priority: true },
    }),
  ]);

  const cards = [
    { label: "Open tasks", value: pendingTasks, icon: ListTodo, tone: "bg-violet-100 text-violet-700" },
    { label: "Tasks completed", value: completedTasks, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Focus sessions", value: sessions, icon: Clock3, tone: "bg-amber-100 text-amber-700" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Study dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Good to see you, {user.name ?? "student"}.</h1>
        <p className="mt-2 text-slate-600">Make a small, useful step on your work today.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className={`mb-5 h-10 w-10 rounded-xl p-2 ${tone}`} aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">{value}</p>
          </article>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-violet-700">NEXT UP</p>
        {nextTask ? <><h2 className="mt-2 text-xl font-bold text-slate-950">{nextTask.title}</h2><p className="mt-1 text-sm text-slate-600">{nextTask.dueDate ? `Due ${nextTask.dueDate.toLocaleDateString()}` : "No due date"} · {nextTask.priority.toLowerCase()} priority</p></> : <p className="mt-2 text-slate-600">No open tasks yet. Add one from the Tasks page.</p>}
      </section>
    </div>
  );
}
