"use client";

import { useState } from "react";
import { Button, Field, Modal, Textarea } from "@/components/ui";

export function PdfNoteComposer({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (content: string) => void;
}) {
  const [content, setContent] = useState("");

  return (
    <Modal title="Add a note" onClose={onCancel}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const next = content.trim();
          if (!next) return;
          onAdd(next);
        }}
      >
        <Field label="Note" required>
          <Textarea
            autoFocus
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write something you want to remember on this page."
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!content.trim()}>
            Add note
          </Button>
        </div>
      </form>
    </Modal>
  );
}
