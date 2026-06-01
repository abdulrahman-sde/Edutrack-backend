import { prisma } from "../../lib/prisma.js";
import type { Gender } from "../../generated/prisma/client.js";

const studentInclude = {
  enrollments: {
    where: { status: "ACTIVE" },
    include: {
      class: true,
    },
    orderBy: { enrollmentDate: "desc" as const },
    take: 1,
  },
};

export async function findAllStudents(institutionId: string) {
  return prisma.student.findMany({
    where: { institutionId },
    include: studentInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findStudentsByClass(classId: string) {
  return prisma.student.findMany({
    where: {
      enrollments: {
        some: {
          classId,
          status: "ACTIVE",
        },
      },
    },
    include: studentInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findStudentById(id: string) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: true,
        },
        orderBy: { enrollmentDate: "desc" },
        take: 1,
      },
    },
  });
}

export async function createStudentWithEnrollment(
  data: {
    admissionNumber: string;
    firstName: string;
    lastName: string;
    dob: Date;
    gender: Gender;
    guardianName?: string | null;
    guardianPhone?: string | null;
    address?: string | null;
    institutionId: string;
  },
  enrollment: {
    classId: string;
    rollNumber?: number | null;
  },
) {
  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({ data });
    await tx.enrollment.create({
      data: {
        studentId: student.id,
        classId: enrollment.classId,
        rollNumber: enrollment.rollNumber ?? null,
        institutionId: data.institutionId,
      },
    });
    return student;
  });
}

export async function updateStudent(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    dob?: Date;
    gender?: Gender;
    guardianName?: string | null;
    guardianPhone?: string | null;
    address?: string | null;
    isActive?: boolean;
  },
) {
  return prisma.student.update({
    where: { id },
    data,
    include: studentInclude,
  });
}

export async function enrollInClass(
  studentId: string,
  classId: string,
  institutionId: string,
  rollNumber?: number | null,
) {
  return prisma.$transaction(async (tx) => {
    await tx.enrollment.updateMany({
      where: { studentId, status: "ACTIVE" },
      data: { status: "DROPPED" },
    });

    return tx.enrollment.create({
      data: {
        studentId,
        classId,
        rollNumber: rollNumber ?? null,
        institutionId,
      },
      include: { class: true },
    });
  });
}

export async function findEnrollment(studentId: string, classId: string) {
  return prisma.enrollment.findUnique({
    where: {
      studentId_classId: { studentId, classId },
    },
  });
}

export async function findLastAdmissionNumber() {
  const last = await prisma.student.findFirst({
    orderBy: { admissionNumber: "desc" },
    select: { admissionNumber: true },
  });
  return last?.admissionNumber ?? null;
}
