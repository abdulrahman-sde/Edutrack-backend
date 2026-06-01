import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "teacher"]),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerAdminSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  institutionName: z
    .string()
    .min(2, "Institution name must be at least 2 characters"),
});

export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;
