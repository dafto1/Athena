// Modal form to rename a resource and/or update its category (REQ-RES-006)
"use client";

import { useState } from "react";
import { Button, Field, Input, Select, ErrorBanner } from "@/components/ui";
import type { Resource } from "./types";

export function ResourceEditModal({
  resource,
  onClose,
  onUpdated,
  categories,
}: {
  resource: Resource;
  onClose: () => void;
  onUpdated: () => void;
  categories: string[];
}) {
  const [title, setTitle] = useState(resource.title);
  const [category, setCategory] = useState(resource.category);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update resource.");
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

      <Field label="Resource Title" required>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
        />
      </Field>

      <Field label="Category / Folder">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </Field>

      <p className="text-xs text-slate-500">
        Original file: <span className="font-medium text-slate-700">{resource.fileName}</span>
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
