"use client";

import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";

type Priority = "LOW" | "MEDIUM" | "HIGH";

interface TaskFormValues {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
}

interface TaskFormProps {
  /** Pre-filled values — pass when editing an existing task */
  defaultValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
  /** Label for the submit button */
  submitLabel?: string;
  /** Show loading state while request is in-flight */
  loading?: boolean;
}

export function TaskForm({
  defaultValues,
  onSubmit,
  submitLabel = "Add task",
  loading = false,
}: TaskFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      title: (form.get("title") as string).trim(),
      description: (form.get("description") as string).trim(),
      dueDate: form.get("dueDate") as string,
      priority: form.get("priority") as Priority,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Title" required>
        <Input
          required
          name="title"
          maxLength={120}
          defaultValue={defaultValues?.title ?? ""}
          placeholder="e.g., Read Chapter 4 of OS"
        />
      </Field>

      <Field label="Description">
        <Textarea
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Key concepts or submission notes..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Deadline">
          <Input
            name="dueDate"
            type="date"
            className="w-full min-w-0 max-w-full px-2 pr-2 text-[13px] sm:text-sm"
            defaultValue={defaultValues?.dueDate ?? ""}
          />
        </Field>

        <Field label="Priority">
          <Select name="priority" defaultValue={defaultValues?.priority ?? "MEDIUM"}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </Field>
      </div>

      <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

// Small reusable priority badge used in TaskCard and elsewhere
export function PriorityBadge({ priority }: { priority: "LOW" | "MEDIUM" | "HIGH" }) {
  const variant = { LOW: "slate", MEDIUM: "amber", HIGH: "rose" } as const;
  return <Badge variant={variant[priority]}>{priority}</Badge>;
}
