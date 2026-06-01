import type { Request, Response } from "express";
import { createSubjectSchema } from "./subjects.validator.js";
import { listSubjects, createSubjectRecord } from "./subjects.service.js";
import { ok, created } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function listSubjectsController(req: Request, res: Response) {
  const subjects = await listSubjects(req.user!.institutionId);
  ok(res, subjects);
}

export async function createSubjectController(req: Request, res: Response) {
  const parsed = createSubjectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const subject = await createSubjectRecord(parsed.data, req.user!.institutionId);
  created(res, subject, "Subject created successfully");
}
