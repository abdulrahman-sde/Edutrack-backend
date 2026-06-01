import type { Request, Response } from "express";
import { createTeacherSchema, updateTeacherSchema } from "./teachers.validator.js";
import { createTeacherAccount, getTeacher, listTeachers, updateTeacher } from "./teachers.service.js";
import { ok, created } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function listTeachersController(req: Request, res: Response) {
  const teachers = await listTeachers(req.user!.institutionId);
  ok(res, teachers);
}

export async function getTeacherController(req: Request, res: Response) {
  const teacher = await getTeacher(req.params.id as string);
  ok(res, teacher);
}

export async function createTeacherController(req: Request, res: Response) {
  const parsed = createTeacherSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }

  const profile = await createTeacherAccount(parsed.data, req.user!.institutionId);
  created(res, profile, "Teacher account created successfully");
}

export async function updateTeacherController(req: Request, res: Response) {
  const parsed = updateTeacherSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }

  const teacher = await updateTeacher(req.params.id as string, parsed.data, req.user!.institutionId);
  ok(res, teacher, "Teacher updated successfully");
}
