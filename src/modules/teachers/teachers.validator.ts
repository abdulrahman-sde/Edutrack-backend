import { z } from "zod";

export const createTeacherSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().nullable().optional(),
  subjects: z.array(z.string()).default([]),
  classIds: z.array(z.string()).default([]),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  subjects: z.array(z.string()).optional(),
  classIds: z.array(z.string()).optional(),
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
