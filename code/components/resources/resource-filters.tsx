// Search and Category filters for resources (REQ-RES-004, REQ-RES-005)
"use client";

import { Input } from "@/components/ui";
import { RESOURCE_CATEGORIES } from "./types";
import { Search } from "lucide-react";

export function ResourceFilters({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const allCategories = ["All", ...RESOURCE_CATEGORIES];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
        {allCategories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-violet-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-64 shrink-0">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search resources…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
