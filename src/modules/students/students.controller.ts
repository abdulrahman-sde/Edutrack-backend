import type { Request, Response } from "express";
import {
  createStudentSchema,
  updateStudentSchema,
  enrollStudentSchema,
  studentQuerySchema,
} from "./students.validator.js";
import {
  listStudents,
  getStudent,
  createStudentRecord,
  updateStudentRecord,
  enrollStudentRecord,
} from "./students.service.js";
import { ok, created } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function listStudentsController(req: Request, res: Response) {
  const query = studentQuerySchema.safeParse(req.query);
  if (!query.success) {
    throw new ValidationError("Invalid query parameters", query.error.issues);
  }
  const students = await listStudents(req.user!.institutionId, query.data.classId);
  ok(res, students);
}

export async function getStudentController(req: Request, res: Response) {
  const student = await getStudent(req.params.id as string);
  ok(res, student);
}

export async function createStudentController(req: Request, res: Response) {
  const parsed = createStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const student = await createStudentRecord(parsed.data, req.user!.institutionId);
  created(res, student, "Student enrolled successfully");
}

export async function updateStudentController(req: Request, res: Response) {
  const parsed = updateStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const student = await updateStudentRecord(req.params.id as string, parsed.data);
  ok(res, student, "Student updated successfully");
}

export async function enrollStudentController(req: Request, res: Response) {
  const parsed = enrollStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const student = await enrollStudentRecord(req.params.id as string, parsed.data, req.user!.institutionId);
  ok(res, student, "Student enrolled in class successfully");
}
