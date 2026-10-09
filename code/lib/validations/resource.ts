import { z } from "zod";

export const resourceRenameSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters or fewer"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(50, "Category must be 50 characters or fewer")
    .optional(),
});
