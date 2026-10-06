"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Edit2,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
};

const priorityClass = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
  HIGH: "bg-rose-50 text-rose-800 border-rose-200",
};

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter and organization states (REQ-TODO-008, REQ-TODO-004)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [sortBy, setSortBy] = useState<"DUE_DATE" | "PRIORITY" | "STATUS" | "TITLE">("DUE_DATE");

  // Create Task (REQ-TODO-001, REQ-TODO-002, REQ-TODO-003, REQ-TODO-009)
  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const title = (form.get("title") as string)?.trim();
    const description = (form.get("description") as string)?.trim();
    const dueDate = form.get("dueDate") as string;
    const priority = form.get("priority") as string;

    if (!title) {
      setError("Please provide a task title.");
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          dueDate: dueDate ? new Date(`${dueDate}T23:59:59.999Z`).toISOString() : undefined,
          priority,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return setError(data.message ?? "Could not add the task. Please verify entered values.");
      }

      event.currentTarget.reset();
      setTasks((current) => [
        { ...data, dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null },
        ...current,
      ]);
    } catch {
      setError("Network error: Could not reach the server.");
    }
  }

  // Edit Task (REQ-TODO-005, REQ-TODO-009)
  async function saveEditTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask) return;
    setError("");

    const form = new FormData(event.currentTarget);
    const title = (form.get("title") as string)?.trim();
    const description = (form.get("description") as string)?.trim();
    const dueDate = form.get("dueDate") as string;
    const priority = form.get("priority") as "LOW" | "MEDIUM" | "HIGH";

    if (!title) {
      setError("A task title is required.");
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          dueDate: dueDate ? new Date(`${dueDate}T23:59:59.999Z`).toISOString() : null,
          priority,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return setError(data.message ?? "Could not update task.");
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === data.id
            ? { ...data, dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null }
            : item
        )
      );
      setEditingTask(null);
    } catch {
      setError("Network error: Could not save changes.");
    }
  }

  // Toggle Completion (REQ-TODO-006)
  async function toggleTask(task: Task) {
    setError("");
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const data = await response.json();
      if (!response.ok) {
        return setError(data.message ?? "Could not update the task status.");
      }
      setTasks((current) =>
        current.map((item) =>
          item.id === data.id
            ? { ...data, dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null }
            : item
        )
      );
    } catch {
      setError("Network error: Could not update task status.");
    }
  }

  // Delete Task (REQ-TODO-007, REQ-SAFE-001)
  async function deleteTask(task: Task) {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"? This cannot be undone.`)) {
      return;
    }
    setError("");
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        return setError(data.message ?? "Could not delete the task.");
      }
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch {
      setError("Network error: Could not delete task.");
    }
  }

  // Organize tasks by filters & sorting (REQ-TODO-008, REQ-TODO-004)
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (statusFilter === "PENDING" && task.completed) return false;
        if (statusFilter === "COMPLETED" && !task.completed) return false;
        if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(query);
          const matchesDesc = task.description?.toLowerCase().includes(query) ?? false;
          if (!matchesTitle && !matchesDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "STATUS") {
          return Number(a.completed) - Number(b.completed);
        }
        if (sortBy === "PRIORITY") {
          const weight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return weight[b.priority] - weight[a.priority];
        }
        if (sortBy === "TITLE") {
          return a.title.localeCompare(b.title);
        }
        // Default: DUE_DATE
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, statusFilter, priorityFilter, searchQuery, sortBy]);

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="mt-8 space-y-6">
      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm"
        >
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="rounded p-1 hover:bg-rose-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Create Task Form + Filterable Task List */}
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Create Task Form (REQ-TODO-001, REQ-TODO-002, REQ-TODO-003) */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <Plus className="h-5 w-5 text-violet-600" />
            Add a task
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Keep track of assignments, study goals, or exams.
          </p>

          <form onSubmit={createTask} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                required
                name="title"
                maxLength={120}
                placeholder="e.g., Read Chapter 4 of OS"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                maxLength={1000}
                placeholder="Key concepts or submission notes..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Deadline
              </label>
              <input
                name="dueDate"
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Priority
              </label>
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                <option value="LOW">Low priority</option>
                <option value="MEDIUM">Medium priority</option>
                <option value="HIGH">High priority</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.99]"
            >
              Add task
            </button>
          </form>
        </div>

        {/* Task List & Organization Controls (REQ-TODO-004, REQ-TODO-008) */}
        <div className="space-y-4">
          {/* Controls Bar: Search, Status tabs, Priority filter, Sort */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Segmented Control (REQ-TODO-004) */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    statusFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    statusFilter === "PENDING"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    statusFilter === "COMPLETED"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Done ({completedCount})
                </button>
              </div>
            </div>

            {/* Filter & Sort selectors */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as "ALL" | "LOW" | "MEDIUM" | "HIGH")
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-violet-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "DUE_DATE" | "PRIORITY" | "STATUS" | "TITLE"
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-violet-500"
                >
                  <option value="DUE_DATE">Deadline (Earliest)</option>
                  <option value="PRIORITY">Priority (Highest)</option>
                  <option value="STATUS">Completion Status</option>
                  <option value="TITLE">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task Items Display (REQ-TODO-004, REQ-TODO-006, REQ-TODO-007) */}
          <div className="space-y-3">
            {filteredAndSortedTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <CheckCircle2 className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-base font-semibold text-slate-800">No tasks found</p>
                <p className="mt-1 text-sm text-slate-500">
                  {searchQuery || priorityFilter !== "ALL" || statusFilter !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "You have no tasks right now. Create your first task to get started!"}
                </p>
              </div>
            ) : (
              filteredAndSortedTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  !task.completed &&
                  new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

                return (
                  <article
                    key={task.id}
                    className={`group relative flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:border-slate-300 ${
                      task.completed
                        ? "border-slate-200 bg-slate-50/70 opacity-75"
                        : isOverdue
                        ? "border-rose-200 bg-rose-50/20"
                        : "border-slate-200"
                    }`}
                  >
                    {/* Checkbox (REQ-TODO-006) */}
                    <button
                      type="button"
                      onClick={() => void toggleTask(task)}
                      aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                      className="mt-0.5 text-slate-400 hover:text-violet-600 transition"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 hover:text-violet-600" />
                      )}
                    </button>

                    {/* Task Details (REQ-TODO-001, REQ-TODO-002, REQ-TODO-003) */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-base font-semibold tracking-tight text-slate-900 ${
                            task.completed ? "line-through text-slate-500" : ""
                          }`}
                        >
                          {task.title}
                        </h3>
                        {isOverdue && (
                          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                            Overdue
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p
                          className={`mt-1.5 text-sm leading-relaxed ${
                            task.completed ? "text-slate-400 line-through" : "text-slate-600"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-semibold ${
                            priorityClass[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>

                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium ${
                              isOverdue
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-slate-200 bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit (REQ-TODO-005) & Delete (REQ-TODO-007) */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => setEditingTask(task)}
                        title="Edit task"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTask(task)}
                        title="Delete task"
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Task Modal (REQ-TODO-005, REQ-TODO-009) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveEditTask} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  name="title"
                  defaultValue={editingTask.title}
                  maxLength={120}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTask.description ?? ""}
                  rows={3}
                  maxLength={1000}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Deadline
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    defaultValue={
                      editingTask.dueDate
                        ? new Date(editingTask.dueDate).toISOString().split("T")[0]
                        : ""
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingTask.priority}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="LOW">Low priority</option>
                    <option value="MEDIUM">Medium priority</option>
                    <option value="HIGH">High priority</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
