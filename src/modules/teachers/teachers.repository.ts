import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export async function findAllTeachers(institutionId: string) {
  return prisma.user.findMany({
    where: { role: "TEACHER", institutionId },
    include: {
      teacherProfile: {
        include: {
          teacherSubjectClasses: {
            include: {
              class: true,
              subject: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTeacherUser(
  userData: { email: string; passwordHash: string; role: "TEACHER" },
  profileData: { firstName: string; lastName: string; phone: string | null; employeeId: string; joiningDate: Date },
  institutionId: string,
) {
  return prisma.user.create({
    data: {
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role,
      institutionId,
      teacherProfile: {
        create: {
          ...profileData,
          institutionId,
        },
      },
    },
    include: {
      teacherProfile: true,
    },
  });
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

export async function createTeacherSubjectClasses(
  data: { teacherId: string; classId: string; subjectId: string; institutionId: string }[],
) {
  if (data.length === 0) return;
  await prisma.teacherSubjectClass.createMany({
    data,
    skipDuplicates: true,
  });
}

export async function findTeacherById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      teacherProfile: {
        include: {
          teacherSubjectClasses: {
            include: {
              class: true,
              subject: true,
            },
          },
        },
      },
    },
  });
}

export async function updateTeacherProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string | null },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      teacherProfile: {
        update: data,
      },
    },
    include: {
      teacherProfile: {
        include: {
          teacherSubjectClasses: {
            include: {
              class: true,
              subject: true,
            },
          },
        },
      },
    },
  });
}

export async function replaceTeacherAssignments(
  teacherProfileId: string,
  assignments: { classId: string; subjectId: string }[],
  institutionId: string,
) {
  await prisma.$transaction(async (tx) => {
    await tx.teacherSubjectClass.deleteMany({
      where: { teacherId: teacherProfileId },
    });

    if (assignments.length > 0) {
      await tx.teacherSubjectClass.createMany({
        data: assignments.map((a) => ({
          teacherId: teacherProfileId,
          classId: a.classId,
          subjectId: a.subjectId,
          institutionId,
        })),
        skipDuplicates: true,
      });
    }
  });
}
