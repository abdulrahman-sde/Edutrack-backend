import type { Request, Response } from "express";
import { saveMarksSchema, marksQuerySchema } from "./marks.validator.js";
import { getMarks, saveMarks } from "./marks.service.js";
import { ok } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function getMarksController(req: Request, res: Response) {
  const query = marksQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new ValidationError("Validation failed", query.error.issues);
  }

  const marks = await getMarks(
    req.params.examId as string,
    query.data.classId,
    query.data.subject,
    req.user!.institutionId,
  );
  ok(res, marks);
}

export async function saveMarksController(req: Request, res: Response) {
  const parsed = saveMarksSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }

  const marks = await saveMarks(
    req.params.examId as string,
    parsed.data,
    req.user!.sub,
    req.user!.institutionId,
  );
  ok(res, marks, "Marks saved successfully");
}
