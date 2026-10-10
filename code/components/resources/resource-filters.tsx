"use client";

import { useState } from "react";
import { IconButton, Input } from "@/components/ui";
import { Plus, Search, Upload } from "lucide-react";

export function ResourceFilters({
  categories,
  onAddCategory,
  onUpload,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: {
  categories: string[];
  onAddCategory: (category: string) => void;
  onUpload: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  function addCategory(event: React.FormEvent) {
    event.preventDefault();
    const value = newCategory.trim().slice(0, 50);
    if (!value) return;
    onAddCategory(value);
    onSelectCategory(value);
    setNewCategory("");
    setAdding(false);
  }

  return (
    <div className="space-y-3 border-b border-slate-200 pb-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => (
          <button key={cat} onClick={() => onSelectCategory(cat)} className={`rounded-md px-3 py-1.5 text-sm transition ${selectedCategory === cat ? "bg-[#f1f0ed] font-medium text-[#37352f]" : "text-slate-600 hover:bg-slate-50"}`}>{cat}</button>
        ))}
        {adding ? (
          <form onSubmit={addCategory} className="flex items-center gap-1">
            <Input aria-label="New category" autoFocus maxLength={50} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Category name" className="w-36 !py-1.5" />
            <button className="rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Add</button>
          </form>
        ) : (
          <IconButton label="Add category" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /></IconButton>
        )}
        <span className="mx-1 h-5 border-l border-slate-200" />
        <IconButton label="Upload resource" onClick={onUpload}><Upload className="h-4 w-4" /></IconButton>
        <IconButton label="Search resources" onClick={() => setSearchOpen((open) => !open)}><Search className="h-4 w-4" /></IconButton>
        {searchOpen && <Input autoFocus value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search resources" aria-label="Search resources" className="ml-auto w-full sm:w-64" />}
      </div>
    </div>
  );
}
