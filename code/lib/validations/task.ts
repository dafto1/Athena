import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "A task title is required").max(120, "Title must not exceed 120 characters"),
  description: z.string().trim().max(1000, "Description must not exceed 1000 characters").optional().nullable(),
  dueDate: z.string().datetime({ message: "Invalid due date format" }).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1, "A task title is required").max(120, "Title must not exceed 120 characters").optional(),
  description: z.string().trim().max(1000, "Description must not exceed 1000 characters").optional().nullable(),
  dueDate: z.string().datetime({ message: "Invalid due date format" }).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  completed: z.boolean().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
