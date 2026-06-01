import { NotFoundError } from "../../shared/errors/http-error.js";
import {
  findAllExams,
  findExamById,
  createExam,
  updateExam,
  deleteExam,
} from "./exams.repository.js";
import type { CreateExamInput, UpdateExamInput } from "./exams.validator.js";

const TERM_MAP: Record<string, string> = {
  monthly: "MONTHLY",
  midterm: "MIDTERM",
  "pre-board": "PRE_BOARD",
  final: "FINAL",
};

const TERM_UNMAP: Record<string, string> = {
  MONTHLY: "monthly",
  MIDTERM: "midterm",
  PRE_BOARD: "pre-board",
  FINAL: "final",
};

type ExamResponse = {
  id: string;
  title: string;
  term: string;
  classIds: string[];
  startDate: string;
  endDate: string;
};

function toResponse(
  exam: Awaited<ReturnType<typeof findAllExams>>[number],
): ExamResponse {
  return {
    id: exam.id,
    title: exam.title,
    term: TERM_UNMAP[exam.term] ?? exam.term.toLowerCase(),
    classIds: exam.examClasses.map((ec) => ec.classId),
    startDate: exam.startDate.toISOString().split("T")[0]!,
    endDate: exam.endDate.toISOString().split("T")[0]!,
  };
}

export async function listExams(institutionId: string) {
  const exams = await findAllExams(institutionId);
  return exams.map(toResponse);
}

export async function getExam(id: string) {
  const exam = await findExamById(id);
  if (!exam) throw new NotFoundError("Exam not found");
  return toResponse(exam);
}

export async function createExamRecord(input: CreateExamInput, institutionId: string) {
  const dbTerm = TERM_MAP[input.term];
  if (!dbTerm) throw new Error(`Invalid term: ${input.term}`);

  const exam = await createExam(
    {
      title: input.title,
      term: dbTerm as any,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      institutionId,
    },
    input.classIds,
  );

  return toResponse(exam);
}

export async function updateExamRecord(id: string, input: UpdateExamInput, institutionId: string) {
  const existing = await findExamById(id);
  if (!existing) throw new NotFoundError("Exam not found");

  const dbTerm = input.term ? (TERM_MAP[input.term] as any) : undefined;

  const exam = await updateExam(
    id,
    {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(dbTerm !== undefined ? { term: dbTerm } : {}),
      ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
      ...(input.endDate !== undefined ? { endDate: new Date(input.endDate) } : {}),
    },
    input.classIds,
  );

  return toResponse(exam);
}

export async function deleteExamRecord(id: string) {
  const exam = await findExamById(id);
  if (!exam) throw new NotFoundError("Exam not found");
  await deleteExam(id);
}
