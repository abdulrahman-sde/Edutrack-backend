import type { Request, Response } from "express";
import { createExamSchema, updateExamSchema } from "./exams.validator.js";
import {
  listExams,
  getExam,
  createExamRecord,
  updateExamRecord,
  deleteExamRecord,
} from "./exams.service.js";
import { ok, created, noContent } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function listExamsController(req: Request, res: Response) {
  const exams = await listExams(req.user!.institutionId);
  ok(res, exams);
}

export async function getExamController(req: Request, res: Response) {
  const exam = await getExam(req.params.id as string);
  ok(res, exam);
}

export async function createExamController(req: Request, res: Response) {
  const parsed = createExamSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const exam = await createExamRecord(parsed.data, req.user!.institutionId);
  created(res, exam, "Exam created successfully");
}

export async function updateExamController(req: Request, res: Response) {
  const parsed = updateExamSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const exam = await updateExamRecord(req.params.id as string, parsed.data, req.user!.institutionId);
  ok(res, exam, "Exam updated successfully");
}

export async function deleteExamController(req: Request, res: Response) {
  await deleteExamRecord(req.params.id as string);
  noContent(res);
}
