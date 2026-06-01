import { z } from "zod";

export const examTermSchema = z.enum(["monthly", "midterm", "pre-board", "final"]);

export const createExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  term: examTermSchema,
  classIds: z.array(z.string().min(1)).min(1, "At least one class is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

export const examQuerySchema = z.object({});

export const updateExamSchema = z.object({
  title: z.string().min(1).optional(),
  term: examTermSchema.optional(),
  classIds: z.array(z.string().min(1)).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type UpdateExamInput = z.infer<typeof updateExamSchema>;
