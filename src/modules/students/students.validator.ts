import { z } from "zod";

export const genderSchema = z.enum(["male", "female", "other"]);

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: genderSchema,
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
  rollNumber: z.number().int().positive().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dob: z.string().optional(),
  gender: genderSchema.optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const enrollStudentSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  rollNumber: z.number().int().positive().optional(),
});

export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;

export const studentQuerySchema = z.object({
  classId: z.string().optional(),
});
