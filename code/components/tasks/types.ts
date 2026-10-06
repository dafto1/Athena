// Shared type used by all task components
export type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
};

export const PRIORITY_BADGE: Record<
  Task["priority"],
  "slate" | "amber" | "rose"
> = {
  LOW: "slate",
  MEDIUM: "amber",
  HIGH: "rose",
};
