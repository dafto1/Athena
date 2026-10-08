// Modal to join a study group via invite code (REQ-GROUP-003)
"use client";

import { useState } from "react";
import { Button, Field, Input, ErrorBanner, Modal } from "@/components/ui";

export function JoinGroupModal({
  onClose,
  onJoined,
}: {
  onClose: () => void;
  onJoined: (groupId: string) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter an invite code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to join group.");
      }

      onJoined(data.groupId);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Join Study Group" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        <Field label="Group Invite Code" required>
          <Input
            placeholder="e.g. 8X2F1A"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={20}
            className="font-mono uppercase tracking-wider text-center text-base"
            required
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-500">
            Ask a study group admin or classmate for their group's invite code.
          </p>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || !code.trim()}>
            {loading ? "Joining…" : "Join Group"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
