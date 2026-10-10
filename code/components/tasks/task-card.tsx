"use client";

import { Calendar, CheckCircle2, Circle, Edit2, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui";
import { PriorityBadge } from "@/components/tasks/task-form";
import type { Task } from "@/components/tasks/types";

interface TaskCardProps {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function isOverdue(task: Task) {
  return (
    !!task.dueDate &&
    !task.completed &&
    new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0)
  );
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const overdue = isOverdue(task);

  return (
    <article
      className={`group relative flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:border-slate-300 ${
        task.completed
          ? "border-slate-200 bg-slate-50/70 opacity-75"
          : overdue
          ? "border-rose-200 bg-rose-50/20"
          : "border-slate-200"
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(task)}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        className="mt-0.5 text-slate-400 transition hover:text-stone-600"
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`text-base font-semibold tracking-tight text-slate-900 ${
              task.completed ? "line-through text-slate-500" : ""
            }`}
          >
            {task.title}
          </h3>
          {overdue && (
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
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium ${
                overdue
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

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-90 transition sm:opacity-0 sm:group-hover:opacity-100">
        <IconButton label="Edit task" onClick={() => onEdit(task)}>
          <Edit2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Delete task" variant="danger" onClick={() => onDelete(task)}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </article>
  );
}
