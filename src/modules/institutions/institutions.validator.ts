import { z } from "zod";

export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
