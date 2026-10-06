"use client";

import { useState } from "react";

type Task = { id: string; title: string; description: string | null; dueDate: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; completed: boolean };

const priorityClass = { LOW: "bg-slate-100 text-slate-700", MEDIUM: "bg-amber-100 text-amber-800", HIGH: "bg-rose-100 text-rose-800" };

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState("");

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.get("title"), description: form.get("description") || undefined, dueDate: form.get("dueDate") ? new Date(`${form.get("dueDate")}T00:00:00.000Z`).toISOString() : undefined, priority: form.get("priority") }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.message ?? "Could not add the task.");
    event.currentTarget.reset();
    setTasks((current) => [data, ...current]);
  }

  async function toggleTask(task: Task) {
    setError("");
    const response = await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !task.completed }) });
    const data = await response.json();
    if (!response.ok) return setError(data.message ?? "Could not update the task.");
    setTasks((current) => current.map((item) => item.id === data.id ? data : item));
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setError("");
    const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (!response.ok) return setError("Could not delete the task.");
    setTasks((current) => current.filter((item) => item.id !== task.id));
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
      <form onSubmit={createTask} className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">Add a task</h2>
        <input required name="title" maxLength={120} placeholder="Task title" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
        <textarea name="description" maxLength={1000} placeholder="Optional description" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
        <input name="dueDate" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
        <select name="priority" defaultValue="MEDIUM" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"><option value="LOW">Low priority</option><option value="MEDIUM">Medium priority</option><option value="HIGH">High priority</option></select>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button className="w-full rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white transition hover:bg-violet-700">Add task</button>
      </form>
      <div className="space-y-3">
        {tasks.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">No tasks yet. Add your first one.</p>}
        {tasks.map((task) => <article key={task.id} className={`flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${task.completed ? "opacity-60" : ""}`}>
          <input aria-label={`Mark ${task.title} complete`} type="checkbox" checked={task.completed} onChange={() => void toggleTask(task)} className="mt-1 h-4 w-4 accent-violet-600" />
          <div className="min-w-0 flex-1"><h2 className={`font-semibold ${task.completed ? "line-through" : ""}`}>{task.title}</h2>{task.description && <p className="mt-1 text-sm text-slate-600">{task.description}</p>}<div className="mt-3 flex gap-2 text-xs"><span className={`rounded-full px-2 py-1 font-semibold ${priorityClass[task.priority]}`}>{task.priority}</span>{task.dueDate && <span className="rounded-full bg-slate-100 px-2 py-1">Due {new Date(task.dueDate).toLocaleDateString()}</span>}</div></div>
          <button onClick={() => void deleteTask(task)} className="text-sm font-semibold text-rose-600 hover:text-rose-700">Delete</button>
        </article>)}
      </div>
    </div>
  );
}
