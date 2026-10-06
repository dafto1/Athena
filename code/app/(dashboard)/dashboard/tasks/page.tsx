import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/tasks/task-board";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Plan your work</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Tasks</h1>
      <p className="mt-2 text-slate-600">Keep the next important thing clear.</p>
      <TaskBoard initialTasks={tasks.map((task) => ({ ...task, dueDate: task.dueDate?.toISOString() ?? null }))} />
    </div>
  );
}
