import { z } from "zod";

export const saveMarksSchema = z.object({
  classId: z.string().min(1),
  subject: z.string().min(1),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        obtained: z.number().min(0),
        maxMarks: z.number().min(1).default(100),
      }),
    )
    .min(1),
});

export type SaveMarksInput = z.infer<typeof saveMarksSchema>;

export const marksQuerySchema = z.object({
  classId: z.string().min(1),
  subject: z.string().min(1),
});
