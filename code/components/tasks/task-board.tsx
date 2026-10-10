"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";

import { Card, EmptyState, ErrorBanner, Modal } from "@/components/ui";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskForm } from "@/components/tasks/task-form";
import type { Task } from "@/components/tasks/types";
import type { StatusFilter, PriorityFilter, SortBy } from "@/components/tasks/task-filters";

// ─── API helpers ─────────────────────────────────────────────────────────────

function toISODate(dateStr: string): string | undefined {
  return dateStr ? new Date(`${dateStr}T23:59:59.999Z`).toISOString() : undefined;
}

function normTask(raw: Task & { dueDate: string | null }): Task {
  return { ...raw, dueDate: raw.dueDate ? new Date(raw.dueDate).toISOString() : null };
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<Task["priority"], number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function applySort(tasks: Task[], sortBy: SortBy): Task[] {
  return [...tasks].sort((a, b) => {
    if (sortBy === "STATUS") return Number(a.completed) - Number(b.completed);
    if (sortBy === "PRIORITY") return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (sortBy === "TITLE") return a.title.localeCompare(b.title);
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  // Filter + sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("DUE_DATE");

  // ── Handlers ──

  async function handleCreate(values: {
    title: string;
    description: string;
    dueDate: string;
    priority: Task["priority"];
  }) {
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description || undefined,
          dueDate: toISODate(values.dueDate),
          priority: values.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message ?? "Could not add the task.");
      setTasks((prev) => [normTask(data), ...prev]);
    } catch {
      setError("Network error: Could not reach the server.");
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(values: {
    title: string;
    description: string;
    dueDate: string;
    priority: Task["priority"];
  }) {
    if (!editingTask) return;
    setError("");
    setEditing(true);
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          dueDate: toISODate(values.dueDate) ?? null,
          priority: values.priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message ?? "Could not update task.");
      setTasks((prev) => prev.map((t) => (t.id === data.id ? normTask(data) : t)));
      setEditingTask(null);
    } catch {
      setError("Network error: Could not save changes.");
    } finally {
      setEditing(false);
    }
  }

  async function handleToggle(task: Task) {
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message ?? "Could not update the task.");
      setTasks((prev) => prev.map((t) => (t.id === data.id ? normTask(data) : t)));
    } catch {
      setError("Network error: Could not update task status.");
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        return setError(data.message ?? "Could not delete the task.");
      }
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch {
      setError("Network error: Could not delete task.");
    }
  }

  // ── Derived lists ──

  const displayed = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (statusFilter === "PENDING" && task.completed) return false;
      if (statusFilter === "COMPLETED" && !task.completed) return false;
      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(q) && !task.description?.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
    return applySort(filtered, sortBy);
  }, [tasks, statusFilter, priorityFilter, searchQuery, sortBy]);

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  // Edit task default values for the form
  const editDefaults = editingTask
    ? {
        title: editingTask.title,
        description: editingTask.description ?? "",
        dueDate: editingTask.dueDate
          ? new Date(editingTask.dueDate).toISOString().split("T")[0]
          : "",
        priority: editingTask.priority,
      }
    : undefined;

  return (
    <div className="mt-8 space-y-6">
      {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Create Task */}
        <Card>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
            <Plus className="h-5 w-5 text-stone-600" />
            Add a task
          </h2>
          <TaskForm
            onSubmit={handleCreate}
            loading={creating}
            submitLabel="Add task"
          />
        </Card>

        {/* Task List */}
        <div className="space-y-4">
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            counts={{ all: tasks.length, pending: pendingCount, completed: completedCount }}
          />

          <div className="space-y-3">
            {displayed.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No tasks found"
                description={
                  searchQuery || priorityFilter !== "ALL" || statusFilter !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "Add your first task to get started."
                }
              />
            ) : (
              displayed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={setEditingTask}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)}>
          <TaskForm
            defaultValues={editDefaults}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
            loading={editing}
          />
        </Modal>
      )}
    </div>
  );
}
