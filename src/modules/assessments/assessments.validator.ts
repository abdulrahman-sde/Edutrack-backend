import { z } from "zod";

export const assessmentTypeSchema = z.enum(["quiz", "assignment", "midterm", "final"]);

export const createAssessmentSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  type: assessmentTypeSchema,
  title: z.string().min(1, "Title is required"),
  totalMarks: z.number().int().positive("Total marks must be positive"),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const saveMarksSchema = z.object({
  entries: z.array(
    z.object({
      studentId: z.string().min(1),
      obtained: z.number().int().min(0),
    }),
  ).min(1, "At least one entry is required"),
});

export type SaveMarksInput = z.infer<typeof saveMarksSchema>;
