import type { Request, Response } from "express";
import { createAssessmentSchema, saveMarksSchema } from "./assessments.validator.js";
import { listAssessments, createAssessmentRecord, saveMarks } from "./assessments.service.js";
import { ok, created } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function listAssessmentsController(req: Request, res: Response) {
  const records = await listAssessments(req.params.classId as string, req.user!.institutionId);
  ok(res, records);
}

export async function createAssessmentController(req: Request, res: Response) {
  const parsed = createAssessmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const assessment = await createAssessmentRecord(
    req.params.classId as string,
    parsed.data,
    req.user!.institutionId,
  );
  created(res, assessment, "Assessment created");
}

export async function saveMarksController(req: Request, res: Response) {
  const parsed = saveMarksSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const assessment = await saveMarks(
    req.params.classId as string,
    req.params.assessmentId as string,
    parsed.data,
  );
  ok(res, assessment, "Marks saved");
}
