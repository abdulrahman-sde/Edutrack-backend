import { z } from "zod";

export const resourceTypeSchema = z.enum(["assignment", "material"]);

export const createResourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  type: resourceTypeSchema,
  classId: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
});

export const updateResourceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  type: resourceTypeSchema.optional(),
  subject: z.string().min(1).optional(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
