import { NotFoundError } from "../../shared/errors/http-error.js";
import {
  upsertSubjectByName,
  findAttendanceRecords,
  upsertAttendanceRecords,
  getAttendanceSummary,
} from "./attendance.repository.js";
import { findClassById } from "../classes/classes.repository.js";
import type { SaveAttendanceInput } from "./attendance.validator.js";

export async function saveAttendance(classId: string, userId: string, institutionId: string, input: SaveAttendanceInput) {
  const cls = await findClassById(classId);
  if (!cls) throw new NotFoundError("Class not found");

  const subject = await upsertSubjectByName(input.subject, institutionId);

  const records = input.records.map((r) => ({
    studentId: r.studentId,
    classId,
    subjectId: subject.id,
    date: new Date(input.date),
    status: r.status.toUpperCase(),
    recordedById: userId,
    institutionId,
  }));

  await upsertAttendanceRecords(records);

  return { saved: records.length };
}

export async function getAttendance(classId: string, institutionId: string, subject?: string, date?: string) {
  const cls = await findClassById(classId);
  if (!cls) throw new NotFoundError("Class not found");

  let subjectId: string | undefined;
  if (subject) {
    const subj = await upsertSubjectByName(subject, institutionId);
    subjectId = subj.id;
  }

  const records = await findAttendanceRecords(
    classId,
    subjectId,
    date ?? new Date().toISOString().split("T")[0]!,
  );

  return records;
}

export async function getSummary(classId: string, institutionId: string, subject?: string) {
  const cls = await findClassById(classId);
  if (!cls) throw new NotFoundError("Class not found");

  let subjectId: string | undefined;
  if (subject) {
    const subj = await upsertSubjectByName(subject, institutionId);
    subjectId = subj.id;
  }

  return getAttendanceSummary(classId, subjectId);
}
