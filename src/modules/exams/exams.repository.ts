import { prisma } from "../../lib/prisma.js";
import type { ExamTerm } from "../../generated/prisma/client.js";

const examInclude = {
  examClasses: {
    include: { class: true },
  },
} as const;

export async function findAllExams(institutionId: string) {
  return prisma.exam.findMany({
    where: { institutionId },
    include: examInclude,
    orderBy: { startDate: "desc" },
  });
}

export async function findExamById(id: string) {
  return prisma.exam.findUnique({
    where: { id },
    include: examInclude,
  });
}

export async function createExam(
  data: {
    title: string;
    term: ExamTerm;
    startDate: Date;
    endDate: Date;
    institutionId: string;
  },
  classIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    const exam = await tx.exam.create({
      data: {
        title: data.title,
        term: data.term,
        startDate: data.startDate,
        endDate: data.endDate,
        institutionId: data.institutionId,
        examClasses: {
          create: classIds.map((classId) => ({
            classId,
            institutionId: data.institutionId,
          })),
        },
      },
      include: examInclude,
    });
    return exam;
  });
}

export async function updateExam(
  id: string,
  data: {
    title?: string;
    term?: ExamTerm;
    startDate?: Date;
    endDate?: Date;
  },
  classIds?: string[],
) {
  return prisma.$transaction(async (tx) => {
    if (classIds) {
      const examForInst = await tx.exam.findUnique({ where: { id }, select: { institutionId: true } });
      await tx.examClass.deleteMany({ where: { examId: id } });
      await tx.examClass.createMany({
        data: classIds.map((classId) => ({
          examId: id,
          classId,
          institutionId: examForInst!.institutionId,
        })),
      });
    }

    const exam = await tx.exam.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.term !== undefined ? { term: data.term } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      },
      include: examInclude,
    });
    return exam;
  });
}

export async function findExamsByClassIds(classIds: string[], institutionId: string) {
  return prisma.exam.findMany({
    where: {
      institutionId,
      examClasses: {
        some: { classId: { in: classIds } },
      },
    },
    include: examInclude,
    orderBy: { startDate: "desc" },
  });
}

export async function deleteExam(id: string) {
  return prisma.exam.delete({ where: { id } });
}
