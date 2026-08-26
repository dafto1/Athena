import { z } from "zod"; 
export const taskSchema = z.object({
  title: z.string().trim().min(1, "A task title is required").max(120), 
  description: z.string().trim().max(1000).optional(), 
  dueDate: z.string().datetime().optional(), 
  priority : z.enum(["LOW", "MEDIUM", "HIGH"]) , 
})
export type TaskInput = z.infer<typeof taskSchema>; 