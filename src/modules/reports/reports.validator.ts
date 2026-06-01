import { z } from "zod";

export const studentReportQuerySchema = z.object({
  classId: z.string().uuid().optional(),
});

export type StudentReportQuery = z.infer<typeof studentReportQuerySchema>;
