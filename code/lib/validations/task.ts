import { z } from "zod"; 

const optionalDate = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value), 
  z.string().datetime().optional(), 

)
export const taskSchema = z.object({
  title: z.string().trim().min(1, "A task title is required").max(120), 
  description: z.string().trim().max(1000).optional(), 
  dueDate: z.string().datetime().optional(), 
  priority : z.enum(["LOW", "MEDIUM", "HIGH"]) , 
}) 

export const taskUpdateSchema = taskSchema.partial().extend({
  completed : z.boolean().optional()
})
export type TaskInput = z.infer<typeof taskSchema>; 