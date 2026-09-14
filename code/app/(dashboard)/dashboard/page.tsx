import { prisma } from "@/lib/prisma"; 
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() { 
  const user = await getCurrentUser(); 
  if (!user) return null; 
  const [pendingTasks, sessions] = await Promise.all([
    prisma.task.count({ where: { userId: user.id, completed: false } }),
    prisma.studySession.count({ where: { userId: user.id } })
  ]);
  return (
    <section>
      <p className="text-sm font-medium text-indigo-600">STUDY DASHBOARD</p>
      <h1 className="mt-1 text-3xl font-bold">Hello, {user.name ?? "student"}.</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-slate-600">Pending tasks</p><p className="mt-2 text-4xl font-bold">{pendingTasks}</p></article>
        <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-slate-600">Completed focus sessions</p><p className="mt-2 text-4xl font-bold">{sessions}</p></article>
      </div>
    </section>
  );
}