import type { Request, Response } from "express";
import { createClassSchema, updateClassSchema, classQuerySchema } from "./classes.validator.js";
import {
  listClasses,
  getClass,
  createClassRecord,
  updateClassRecord,
  deleteClassRecord,
} from "./classes.service.js";
import { ok, created, noContent } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function listClassesController(req: Request, res: Response) {
  const query = classQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new ValidationError("Invalid query parameters", query.error.issues);
  }
  const classes = await listClasses(req.user!.institutionId, query.data.scope, req.user?.sub);
  ok(res, classes);
}

export async function getClassController(req: Request, res: Response) {
  const cls = await getClass(req.params.id as string);
  ok(res, cls);
}

export async function createClassController(req: Request, res: Response) {
  const parsed = createClassSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const cls = await createClassRecord(parsed.data, req.user!.institutionId);
  created(res, cls, "Class created successfully");
}

export async function updateClassController(req: Request, res: Response) {
  const parsed = updateClassSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const cls = await updateClassRecord(req.params.id as string, parsed.data, req.user!.institutionId);
  ok(res, cls, "Class updated successfully");
}

export async function deleteClassController(req: Request, res: Response) {
  await deleteClassRecord(req.params.id as string);
  noContent(res);
}
