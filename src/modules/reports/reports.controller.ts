import type { Request, Response } from "express";
import { studentReportQuerySchema } from "./reports.validator.js";
import { getInstitutionStats, getStudentReports, getTeacherStudentReports, getStudentDetailReport } from "./reports.service.js";
import { ok } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function statsController(req: Request, res: Response) {
  const stats = await getInstitutionStats(req.user!.institutionId);
  ok(res, stats);
}

export async function studentReportsController(req: Request, res: Response) {
  const parsed = studentReportQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.issues);
  }

  if (req.user!.role === "teacher") {
    if (parsed.data.classId) {
      const reports = await getStudentReports(req.user!.institutionId, parsed.data);
      ok(res, reports);
    } else {
      const reports = await getTeacherStudentReports(req.user!.sub, req.user!.institutionId);
      ok(res, reports);
    }
    return;
  }

  const reports = await getStudentReports(req.user!.institutionId, parsed.data);
  ok(res, reports);
}

export async function studentDetailController(req: Request, res: Response) {
  const report = await getStudentDetailReport(req.params.studentId as string, req.user!.institutionId);
  ok(res, report);
}
