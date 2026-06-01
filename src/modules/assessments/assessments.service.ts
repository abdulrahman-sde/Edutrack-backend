import { NotFoundError } from "../../shared/errors/http-error.js";
import { upsertSubjectByName } from "../classes/classes.repository.js";
import {
  findAssessmentsByClass,
  findAssessmentById,
  createAssessment,
  upsertAssessmentEntries,
} from "./assessments.repository.js";
import type { CreateAssessmentInput, SaveMarksInput } from "./assessments.validator.js";

const TYPE_MAP: Record<string, string> = {
  quiz: "QUIZ",
  assignment: "ASSIGNMENT",
  midterm: "MIDTERM",
  final: "FINAL",
};

const TYPE_UNMAP: Record<string, string> = {
  QUIZ: "quiz",
  ASSIGNMENT: "assignment",
  MIDTERM: "midterm",
  FINAL: "final",
};

type AssessmentResponse = {
  id: string;
  classId: string;
  subject: string;
  type: string;
  title: string;
  date: string;
  totalMarks: number;
  entries: { studentId: string; obtained: number; total: number; grade: string }[];
};

function gradeFor(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function toResponse(
  assessment: Awaited<ReturnType<typeof findAssessmentsByClass>>[number],
): AssessmentResponse {
  return {
    id: assessment.id,
    classId: assessment.classId,
    subject: assessment.subject.name,
    type: TYPE_UNMAP[assessment.type] ?? assessment.type.toLowerCase(),
    title: assessment.title,
    date: assessment.date.toISOString().split("T")[0]!,
    totalMarks: assessment.totalMarks,
    entries: assessment.entries.map((e) => {
      const pct = Math.round((e.obtained / assessment.totalMarks) * 100);
      return {
        studentId: e.studentId,
        obtained: e.obtained,
        total: assessment.totalMarks,
        grade: gradeFor(pct),
      };
    }),
  };
}

export async function listAssessments(classId: string, institutionId: string) {
  const records = await findAssessmentsByClass(classId);
  return records.map(toResponse);
}

export async function createAssessmentRecord(
  classId: string,
  input: CreateAssessmentInput,
  institutionId: string,
) {
  const dbType = TYPE_MAP[input.type];
  if (!dbType) throw new Error(`Invalid type: ${input.type}`);

  const subject = await upsertSubjectByName(input.subject, institutionId);

  const assessment = await createAssessment({
    classId,
    subjectId: subject.id,
    type: dbType as any,
    title: input.title,
    totalMarks: input.totalMarks,
    date: new Date(),
    institutionId,
  });

  return {
    ...toResponse(assessment),
    entries: [],
  };
}

export async function saveMarks(
  classId: string,
  assessmentId: string,
  input: SaveMarksInput,
) {
  const assessment = await findAssessmentById(assessmentId);
  if (!assessment) throw new NotFoundError("Assessment not found");
  if (assessment.classId !== classId) throw new NotFoundError("Assessment not found in this class");

  await upsertAssessmentEntries(
    assessmentId,
    input.entries.map((e) => ({
      studentId: e.studentId,
      obtained: Math.min(e.obtained, assessment.totalMarks),
    })),
  );

  const updated = await findAssessmentById(assessmentId);
  return toResponse(updated!);
}
