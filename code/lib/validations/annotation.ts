import { z } from "zod";

export const annotationSchema = z.object({
  type: z.enum(["HIGHLIGHT", "NOTE"]),
  pageNumber: z.number().int().min(1),
  content: z.string().trim().max(2000).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value.")
    .default("#facc15"),
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  wPct: z.number().min(0).max(100),
  hPct: z.number().min(0).max(100),
});

export const annotationBulkSchema = z.object({
  items: z.array(annotationSchema).min(1).max(50),
});

export const annotationUpdateSchema = z.object({
  content: z.string().trim().min(1).max(2000).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex value.")
    .optional(),
});
