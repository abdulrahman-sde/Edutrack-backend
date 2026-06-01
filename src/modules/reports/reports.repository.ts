import { prisma } from "../../lib/prisma.js";

export function countStudents(institutionId: string) {
  return prisma.student.count({
    where: { institutionId, isActive: true },
  });
}

export function countTeachers(institutionId: string) {
  return prisma.user.count({
    where: { role: "TEACHER", institutionId },
  });
}

export function countClasses(institutionId: string) {
  return prisma.class.count({
    where: { institutionId },
  });
}

export function findAttendanceSummary(institutionId: string) {
  return prisma.attendance.groupBy({
    by: ["status"],
    where: { institutionId },
    _count: { status: true },
  });
}

export function findOverallExamMarks(institutionId: string) {
  return prisma.examMark.findMany({
    where: { institutionId },
    select: {
      marksObtained: true,
      maxMarks: true,
    },
  });
}

export function findStudentsWithEnrollments(institutionId: string, classId?: string) {
  const where: Record<string, unknown> = { institutionId, isActive: true };
  if (classId) {
    where.enrollments = { some: { classId } };
  }
  return prisma.student.findMany({
    where,
    include: {
      enrollments: {
        include: { class: true },
        ...(classId ? { where: { classId } } : {}),
      },
      attendances: {
        where: { institutionId },
        select: { status: true },
      },
      examMarks: {
        where: { institutionId },
        select: {
          marksObtained: true,
          maxMarks: true,
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { firstName: "asc" },
  });
}

export function findStudentsByTeacherClasses(teacherId: string, institutionId: string) {
  return prisma.teacherSubjectClass.findMany({
    where: { teacherId: teacherId, institutionId },
    include: {
      class: {
        include: {
          enrollments: {
            include: {
              student: {
                include: {
                  attendances: {
                    where: { institutionId },
                    select: { status: true },
                  },
                  examMarks: {
                    where: { institutionId },
                    select: {
                      marksObtained: true,
                      maxMarks: true,
                      subject: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export function findStudentDetail(studentId: string, institutionId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, institutionId },
    include: {
      enrollments: {
        include: { class: true },
        take: 1,
      },
      attendances: {
        where: { institutionId },
        include: { subject: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
      examMarks: {
        where: { institutionId },
        include: {
          subject: { select: { name: true } },
          exam: { select: { title: true, term: true, startDate: true } },
        },
        orderBy: { exam: { startDate: "desc" } },
      },
    },
  });
}

export function findAvgAttendance(institutionId: string, classId?: string) {
  const where: Record<string, unknown> = { institutionId };
  if (classId) where.classId = classId;
  return prisma.attendance.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  });
}
