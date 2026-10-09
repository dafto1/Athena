// Modal allowing a member to share personal resources into the study group (REQ-GROUP-005)
"use client";

import { useEffect, useState } from "react";
import { Button, Field, Select, ErrorBanner, Modal } from "@/components/ui";
import type { Resource } from "@/components/resources/types";
import type { StudyGroupFolder } from "./types";

export function ShareResourceModal({
  groupId,
  folders,
  onClose,
  onShared,
}: {
  groupId: string;
  folders: StudyGroupFolder[];
  onClose: () => void;
  onShared: () => void;
}) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [loadingResources, setLoadingResources] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/resources")
      .then((r) => r.json())
      .then((data: Resource[]) => {
        setResources(data);
        if (data.length > 0) setSelectedResourceId(data[0].id);
      })
      .catch(() => setError("Failed to load your personal resources"))
      .finally(() => setLoadingResources(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedResourceId) {
      setError("Please select a resource to share.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/groups/${groupId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedResourceId,
          folderId: selectedFolderId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to share resource");

      onShared();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Share Resource to Study Group" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        <Field label="Select from Your Study Materials" required>
          {loadingResources ? (
            <p className="text-xs text-slate-500">Loading your resources…</p>
          ) : resources.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              You haven't uploaded any resources yet. Please upload study files in your Resources library first.
            </p>
          ) : (
            <Select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              required
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.fileName}) — {r.category}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Target Folder in Group">
          <Select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
          >
            <option value="">No folder (General root)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || loadingResources || resources.length === 0}
          >
            {submitting ? "Sharing…" : "Share with Group"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
