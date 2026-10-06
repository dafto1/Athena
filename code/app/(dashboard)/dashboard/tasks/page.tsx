import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/tasks/task-board";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Plan your work"
        title="Tasks"
        description="Keep the next important thing clear."
      />
      <TaskBoard
        initialTasks={tasks.map((task) => ({
          ...task,
          dueDate: task.dueDate?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
