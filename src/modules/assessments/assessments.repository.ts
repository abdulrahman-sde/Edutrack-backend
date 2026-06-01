import { prisma } from "../../lib/prisma.js";
import type { AssessmentType } from "../../generated/prisma/client.js";

const assessmentInclude = {
  subject: { select: { name: true } },
  entries: {
    include: { student: { select: { firstName: true, lastName: true } } },
  },
} as const;

export async function findAssessmentsByClass(classId: string) {
  return prisma.assessment.findMany({
    where: { classId },
    include: assessmentInclude,
    orderBy: { date: "desc" },
  });
}

export async function findAssessmentById(id: string) {
  return prisma.assessment.findUnique({
    where: { id },
    include: assessmentInclude,
  });
}

export async function createAssessment(data: {
  classId: string;
  subjectId: string;
  type: AssessmentType;
  title: string;
  totalMarks: number;
  date: Date;
  institutionId: string;
}) {
  return prisma.assessment.create({
    data,
    include: assessmentInclude,
  });
}

export async function upsertAssessmentEntries(
  assessmentId: string,
  entries: { studentId: string; obtained: number }[],
) {
  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      await tx.assessmentEntry.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId,
            studentId: entry.studentId,
          },
        },
        update: { obtained: entry.obtained },
        create: {
          assessmentId,
          studentId: entry.studentId,
          obtained: entry.obtained,
        },
      });
    }
  });
}
