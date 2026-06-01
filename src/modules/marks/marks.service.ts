import { NotFoundError } from "../../shared/errors/http-error.js";
import { findExamById } from "../exams/exams.repository.js";
import {
  findStudentsWithMarks,
  upsertExamMarks,
  findSubjectByName,
} from "./marks.repository.js";
import type { SaveMarksInput } from "./marks.validator.js";

export type MarksResponse = {
  examId: string;
  classId: string;
  subject: string;
  entries: {
    studentId: string;
    studentName: string;
    rollNumber: number | null;
    obtained: number;
    maxMarks: number;
  }[];
};

export async function getMarks(
  examId: string,
  classId: string,
  subject: string,
  institutionId: string,
) {
  const exam = await findExamById(examId);
  if (!exam) throw new NotFoundError("Exam not found");

  const subjectRecord = await findSubjectByName(subject, institutionId);
  if (!subjectRecord) throw new NotFoundError("Subject not found");

  const entries = await findStudentsWithMarks(examId, classId, subjectRecord.id);
  return { examId, classId, subject, entries } satisfies MarksResponse;
}

export async function saveMarks(
  examId: string,
  input: SaveMarksInput,
  userId: string,
  institutionId: string,
) {
  const exam = await findExamById(examId);
  if (!exam) throw new NotFoundError("Exam not found");

  const subjectRecord = await findSubjectByName(input.subject, institutionId);
  if (!subjectRecord) throw new NotFoundError("Subject not found");

  await upsertExamMarks(
    examId,
    subjectRecord.id,
    userId,
    institutionId,
    input.entries,
  );

  const entries = await findStudentsWithMarks(examId, input.classId, subjectRecord.id);
  return { examId, classId: input.classId, subject: input.subject, entries } satisfies MarksResponse;
}
