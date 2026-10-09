// Main Resource Manager orchestrator (REQ-RES-001 - REQ-RES-008)
"use client";

import { useEffect, useState, useTransition } from "react";
import { Button, Modal, EmptyState } from "@/components/ui";
import { Plus, FolderOpen } from "lucide-react";
import { ResourceCard } from "./resource-card";
import { ResourceUploadForm } from "./resource-upload-form";
import { ResourceEditModal } from "./resource-edit-modal";
import { ResourceFilters } from "./resource-filters";
import type { Resource } from "./types";

export function ResourceManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [, startTransition] = useTransition();

  async function fetchResources() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (search.trim()) params.set("query", search.trim());

      const res = await fetch(`/api/resources?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch (err) {
      console.error("Failed to fetch resources:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, [category, search]);

  function handleResourceDeleted(id: string) {
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Study Materials & Files
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {resources.length} {resources.length === 1 ? "resource" : "resources"} found
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Upload Resource
        </Button>
      </div>

      {/* Filter and Search */}
      <ResourceFilters
        selectedCategory={category}
        onSelectCategory={(c) => startTransition(() => setCategory(c))}
        searchQuery={search}
        onSearchChange={(q) => startTransition(() => setSearch(q))}
      />

      {/* Resource Grid / List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={search || category !== "All" ? "No matching resources" : "No study resources yet"}
          description={
            search || category !== "All"
              ? "Try adjusting your search query or selected category filter."
              : "Upload lecture slides, notes, assignments, or research papers to build your library."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onEdit={setEditingResource}
              onDelete={handleResourceDeleted}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <Modal title="Upload Study Resource" onClose={() => setShowUpload(false)}>
          <ResourceUploadForm
            onSuccess={() => {
              setShowUpload(false);
              fetchResources();
            }}
            onCancel={() => setShowUpload(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingResource && (
        <Modal
          title="Edit Resource Details"
          onClose={() => setEditingResource(null)}
        >
          <ResourceEditModal
            resource={editingResource}
            onClose={() => setEditingResource(null)}
            onUpdated={() => {
              fetchResources();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
