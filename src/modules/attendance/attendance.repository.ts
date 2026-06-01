import { prisma } from "../../lib/prisma.js";
import type { AttendanceStatus } from "../../generated/prisma/client.js";

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

export async function findAttendanceRecords(classId: string, subjectId?: string, date?: string) {
  return prisma.attendance.findMany({
    where: {
      classId,
      ...(subjectId ? { subjectId } : {}),
      ...(date ? { date: new Date(date) } : {}),
    },
    select: {
      studentId: true,
      status: true,
    },
  });
}

export async function upsertAttendanceRecords(
  records: { studentId: string; classId: string; subjectId: string; date: Date; status: string; recordedById: string; institutionId: string }[],
) {
  const typed = records.map((r) => ({
    ...r,
    status: r.status.toUpperCase() as AttendanceStatus,
  }));

  await prisma.$transaction(async (tx) => {
    for (const record of typed) {
      await tx.attendance.upsert({
        where: {
          studentId_classId_subjectId_date: {
            studentId: record.studentId,
            classId: record.classId,
            subjectId: record.subjectId,
            date: record.date,
          },
        },
        update: { status: record.status, recordedById: record.recordedById },
        create: {
          studentId: record.studentId,
          classId: record.classId,
          subjectId: record.subjectId,
          date: record.date,
          status: record.status,
          recordedById: record.recordedById,
          institutionId: record.institutionId,
        },
      });
    }
  });
}

export async function getAttendanceSummary(classId: string, subjectId?: string) {
  const where = {
    classId,
    ...(subjectId ? { subjectId } : {}),
  };

  const results = await prisma.attendance.groupBy({
    by: ["studentId"],
    where,
    _count: { status: true },
    _max: { date: true },
  });

  const statusCounts = await Promise.all(
    results.map(async (r) => {
      const breakdown = await prisma.attendance.groupBy({
        by: ["status"],
        where: { ...where, studentId: r.studentId },
        _count: true,
      });
      const present = breakdown.find((b) => b.status === "PRESENT")?._count ?? 0;
      const absent = breakdown.find((b) => b.status === "ABSENT")?._count ?? 0;
      const late = breakdown.find((b) => b.status === "LATE")?._count ?? 0;
      const total = present + absent + late;
      return {
        studentId: r.studentId,
        present,
        absent,
        late,
        total,
        percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    }),
  );

  return statusCounts;
}
