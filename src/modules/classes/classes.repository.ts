import { prisma } from "../../lib/prisma.js";
import type { CreateClassInput, UpdateClassInput } from "./classes.validator.js";

export async function findAllClasses(institutionId: string) {
  return prisma.class.findMany({
    where: { institutionId },
    include: {
      teacherSubjectClasses: {
        include: {
          teacher: true,
          subject: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
      },
    },
    orderBy: [{ name: "asc" }, { section: "asc" }],
  });
}

export async function findClassesByTeacher(teacherProfileId: string, institutionId: string) {
  return prisma.class.findMany({
    where: {
      institutionId,
      teacherSubjectClasses: {
        some: { teacherId: teacherProfileId },
      },
    },
    include: {
      teacherSubjectClasses: {
        where: { teacherId: teacherProfileId },
        include: {
          teacher: true,
          subject: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
      },
    },
    orderBy: [{ name: "asc" }, { section: "asc" }],
  });
}

export async function findClassById(id: string) {
  return prisma.class.findUnique({
    where: { id },
    include: {
      teacherSubjectClasses: {
        include: {
          teacher: true,
          subject: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: true },
      },
    },
  });
}

export async function createClass(data: CreateClassInput & { institutionId: string }) {
  return prisma.class.create({
    data: {
      name: data.name,
      section: data.section,
      capacity: data.capacity ?? null,
      institutionId: data.institutionId,
    },
    include: {
      teacherSubjectClasses: {
        include: {
          teacher: true,
          subject: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
      },
    },
  });
}

export async function updateClass(id: string, data: UpdateClassInput) {
  const clean: Record<string, unknown> = {};
  if (data.name !== undefined) clean.name = data.name;
  if (data.section !== undefined) clean.section = data.section;
  if (data.capacity !== undefined) clean.capacity = data.capacity;

  const cls = await prisma.class.update({
    where: { id },
    data: clean as any,
    include: {
      teacherSubjectClasses: {
        include: {
          teacher: true,
          subject: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
      },
    },
  });
  return cls as typeof cls & { teacherSubjectClasses: any[]; enrollments: any[] };
}

export async function deleteClass(id: string) {
  return prisma.class.delete({ where: { id } });
}

export async function findTeacherProfileByUserId(userId: string) {
  return prisma.teacherProfile.findUnique({ where: { userId } });
}

export async function upsertSubjectByName(name: string, institutionId: string) {
  let subject = await prisma.subject.findFirst({ where: { name, institutionId } });
  if (!subject) {
    const code = name.substring(0, 4).toUpperCase() + "-" + Date.now();
    subject = await prisma.subject.create({
      data: { name, code, institutionId },
    });
  }
  return subject;
}

export async function replaceTeacherSubjectClasses(
  classId: string,
  assignments: { teacherId: string; subjectId: string; dayOfWeek?: number | null; startTime?: string | null; endTime?: string | null }[],
  institutionId: string,
) {
  await prisma.$transaction(async (tx) => {
    await tx.teacherSubjectClass.deleteMany({
      where: { classId },
    });

    if (assignments.length > 0) {
      await tx.teacherSubjectClass.createMany({
        data: assignments.map((a) => ({
          teacherId: a.teacherId,
          classId,
          subjectId: a.subjectId,
          dayOfWeek: a.dayOfWeek ?? null,
          startTime: a.startTime ?? null,
          endTime: a.endTime ?? null,
          institutionId,
        })),
        skipDuplicates: true,
      });
    }
  });
}
