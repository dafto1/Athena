// Shared folders navigation & folder creation (REQ-GROUP-008)
"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, ErrorBanner } from "@/components/ui";
import { Folder, FolderPlus } from "lucide-react";
import type { StudyGroupFolder } from "./types";

export function GroupFoldersBar({
  groupId,
  folders,
  selectedFolderId,
  onSelectFolder,
  onFolderCreated,
}: {
  groupId: string;
  folders: StudyGroupFolder[];
  selectedFolderId: string;
  onSelectFolder: (id: string) => void;
  onFolderCreated: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/groups/${groupId}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create folder");

      setName("");
      setShowAdd(false);
      onFolderCreated();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => onSelectFolder("all")}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            selectedFolderId === "all"
              ? "bg-violet-600 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Folder className="h-3.5 w-3.5" />
          All Resources
        </button>

        {folders.map((folder) => {
          const active = selectedFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-violet-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              <span>{folder.name}</span>
              {typeof folder._count?.resources === "number" && (
                <span className="ml-1 opacity-75">({folder._count.resources})</span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowAdd(true)}
        className="flex items-center gap-1 text-xs"
      >
        <FolderPlus className="h-3.5 w-3.5" />
        New Folder
      </Button>

      {showAdd && (
        <Modal title="Create Shared Folder" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}
            <Field label="Folder Name" required>
              <Input
                placeholder="e.g. Exam Prep, Week 1, Lab Notes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                required
                autoFocus
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
                {loading ? "Creating…" : "Create Folder"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
