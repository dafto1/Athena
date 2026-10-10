"use client";

import { Filter, Search, X } from "lucide-react";
import { Select } from "@/components/ui";

export type StatusFilter = "ALL" | "PENDING" | "COMPLETED";
export type PriorityFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH";
export type SortBy = "DUE_DATE" | "PRIORITY" | "STATUS" | "TITLE";

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (val: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  onPriorityChange: (val: PriorityFilter) => void;
  sortBy: SortBy;
  onSortChange: (val: SortBy) => void;
  counts: { all: number; pending: number; completed: number };
}

const statusBtnClass = (active: boolean, color: string) =>
  `rounded-lg px-3 py-1.5 transition ${
    active ? `bg-white ${color} shadow-sm` : "text-slate-600 hover:text-slate-900"
  }`;

export function TaskFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sortBy,
  onSortChange,
  counts,
}: TaskFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      {/* Search + Status tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2 text-sm outline-none transition focus:border-stone-500 focus:bg-white focus:ring-2 focus:ring-stone-100"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status segmented control */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => onStatusChange("ALL")}
            className={statusBtnClass(statusFilter === "ALL", "text-slate-900")}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => onStatusChange("PENDING")}
            className={statusBtnClass(statusFilter === "PENDING", "text-stone-700")}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => onStatusChange("COMPLETED")}
            className={statusBtnClass(statusFilter === "COMPLETED", "text-emerald-700")}
          >
            Done ({counts.completed})
          </button>
        </div>
      </div>

      {/* Priority filter + Sort */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium">Priority:</span>
          <Select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as PriorityFilter)}
            className="!py-1 !px-2 !text-xs"
          >
            <option value="ALL">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
        </div>

        <label className="flex min-w-0 items-center gap-2 sm:ml-auto">
          <span className="shrink-0 whitespace-nowrap font-medium text-slate-600">Sort by</span>
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            className="!w-auto min-w-0 max-w-56 !py-1 !px-2 !text-xs"
          >
            <option value="DUE_DATE">Deadline (Earliest)</option>
            <option value="PRIORITY">Priority (Highest)</option>
            <option value="STATUS">Completion Status</option>
            <option value="TITLE">Title (A–Z)</option>
          </Select>
        </label>
      </div>
    </div>
  );
}
