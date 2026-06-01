import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().min(1, "Section is required"),
  capacity: z.number().int().positive().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const subjectTeacherSchema = z.object({
  subject: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(4).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  section: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  subjectTeachers: z.array(subjectTeacherSchema).optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;

export const classQuerySchema = z.object({
  scope: z.enum(["teacher"]).optional(),
});
