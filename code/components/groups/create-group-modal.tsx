// Modal form to create a new study group (REQ-GROUP-001, REQ-GROUP-002)
"use client";

import { useState } from "react";
import { Button, Field, Input, Textarea, ErrorBanner, Modal } from "@/components/ui";

export function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (groupId: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Study group name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create study group.");
      }

      onCreated(data.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Create Study Group" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        <Field label="Group Name" required>
          <Input
            placeholder="e.g. Distributed Systems Study Group"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            autoFocus
          />
        </Field>

        <Field label="Description (optional)">
          <Textarea
            placeholder="What subjects or topics will this group focus on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={200}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
            {loading ? "Creating…" : "Create Group"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
