import { prisma } from "../../lib/prisma.js";

export async function findStudentsWithMarks(
  examId: string,
  classId: string,
  subjectId: string,
) {
  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    include: {
      student: true,
    },
    orderBy: { rollNumber: "asc" },
  });

  const marks = await prisma.examMark.findMany({
    where: { examId, subjectId },
    select: {
      studentId: true,
      marksObtained: true,
      maxMarks: true,
    },
  });

  const marksByStudent = new Map(
    marks.map((m) => [m.studentId, { obtained: Number(m.marksObtained), maxMarks: Number(m.maxMarks) }]),
  );

  return enrollments.map((enr) => {
    const mark = marksByStudent.get(enr.student.id);
    return {
      studentId: enr.student.id,
      studentName: `${enr.student.firstName} ${enr.student.lastName}`.trim(),
      rollNumber: enr.rollNumber,
      obtained: mark?.obtained ?? 0,
      maxMarks: mark?.maxMarks ?? 100,
    };
  });
}

export async function upsertExamMarks(
  examId: string,
  subjectId: string,
  recordedById: string,
  institutionId: string,
  entries: { studentId: string; obtained: number; maxMarks: number }[],
) {
  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      await tx.examMark.upsert({
        where: {
          examId_studentId_subjectId: {
            examId,
            studentId: entry.studentId,
            subjectId,
          },
        },
        update: {
          marksObtained: entry.obtained,
          maxMarks: entry.maxMarks,
          recordedById,
        },
        create: {
          examId,
          studentId: entry.studentId,
          subjectId,
          marksObtained: entry.obtained,
          maxMarks: entry.maxMarks,
          recordedById,
          institutionId,
        },
      });
    }
  });
}

export async function findSubjectByName(name: string, institutionId: string) {
  return prisma.subject.findFirst({ where: { name, institutionId } });
}
