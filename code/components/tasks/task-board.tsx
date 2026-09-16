"use client";

import { useEffect, useState } from "react";

type Task = { id: string; title: string; description: string | null; dueDate: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; completed: boolean };

const priorityClass = { LOW: "bg-slate-100 text-slate-700", MEDIUM: "bg-amber-100 text-amber-800", HIGH: "bg-rose-100 text-rose-800" };

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    setLoading(true);
    const response = await fetch("/api/tasks");
    if (!response.ok) setError("Could not load tasks.");
    else setTasks(await response.json());
    setLoading(false);
  }

  useEffect(() => { void loadTasks(); }, []);

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.get("title"), description: form.get("description") || undefined, dueDate: form.get("dueDate") ? new Date(`${form.get("dueDate")}T00:00:00.000Z`).toISOString() : undefined, priority: form.get("priority") }),
    });
    if (!response.ok) { const data = await response.json(); return setError(data.message ?? "Could not add the task."); }
    event.currentTarget.reset();
    await loadTasks();
  }

  async function toggleTask(task: Task) {
    await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !task.completed }) });
    await loadTasks();
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    await loadTasks();
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
      <form onSubmit={createTask} className="h-fit space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-bold">Add task</h2>
        <input required name="title" maxLength={120} placeholder="Task title" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <textarea name="description" maxLength={1000} placeholder="Optional description" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <input name="dueDate" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <select name="priority" defaultValue="MEDIUM" className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="LOW">Low priority</option><option value="MEDIUM">Medium priority</option><option value="HIGH">High priority</option></select>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">Add task</button>
      </form>
      <div className="space-y-3">
        {loading && <p>Loading tasks…</p>}
        {!loading && tasks.length === 0 && <p className="rounded-xl bg-white p-5 text-slate-600 ring-1 ring-slate-200">No tasks yet. Add your first one.</p>}
        {tasks.map((task) => <article key={task.id} className={`flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${task.completed ? "opacity-60" : ""}`}>
          <input aria-label={`Mark ${task.title} complete`} type="checkbox" checked={task.completed} onChange={() => void toggleTask(task)} className="mt-1 h-4 w-4" />
          <div className="min-w-0 flex-1"><h2 className={`font-semibold ${task.completed ? "line-through" : ""}`}>{task.title}</h2>{task.description && <p className="mt-1 text-sm text-slate-600">{task.description}</p>}<div className="mt-3 flex gap-2 text-xs"><span className={`rounded-full px-2 py-1 font-semibold ${priorityClass[task.priority]}`}>{task.priority}</span>{task.dueDate && <span className="rounded-full bg-slate-100 px-2 py-1">Due {new Date(task.dueDate).toLocaleDateString()}</span>}</div></div>
          <button onClick={() => void deleteTask(task)} className="text-sm font-semibold text-rose-600">Delete</button>
        </article>)}
      </div>
    </div>
  );
}
