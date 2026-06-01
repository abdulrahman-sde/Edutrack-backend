import type { Request, Response } from "express";
import { saveAttendanceSchema, attendanceQuerySchema } from "./attendance.validator.js";
import { saveAttendance, getAttendance, getSummary } from "./attendance.service.js";
import { ok, created } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function saveAttendanceController(req: Request, res: Response) {
  const parsed = saveAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }

  const result = await saveAttendance(
    req.params.classId as string,
    req.user!.sub,
    req.user!.institutionId,
    parsed.data,
  );
  created(res, result, "Attendance saved");
}

export async function getAttendanceController(req: Request, res: Response) {
  const query = attendanceQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new ValidationError("Invalid query", query.error.issues);
  }

  const records = await getAttendance(
    req.params.classId as string,
    req.user!.institutionId,
    query.data.subject,
    query.data.date,
  );
  ok(res, records);
}

export async function getAttendanceSummaryController(req: Request, res: Response) {
  const query = attendanceQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new ValidationError("Invalid query", query.error.issues);
  }

  const summary = await getSummary(
    req.params.classId as string,
    req.user!.institutionId,
    query.data.subject,
  );
  ok(res, summary);
}
