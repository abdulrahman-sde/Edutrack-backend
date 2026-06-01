import { z } from "zod";

const attendanceStatusSchema = z.enum(["present", "absent", "late", "leave"]);

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1),
  status: attendanceStatusSchema,
});

export const saveAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  subject: z.string().min(1, "Subject name is required"),
  records: z.array(attendanceRecordSchema).min(1, "At least one record is required"),
});

export type SaveAttendanceInput = z.infer<typeof saveAttendanceSchema>;

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
  subject: z.string().optional(),
});
