import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
