import { NotFoundError } from "../../shared/errors/http-error.js";
import { findUserById } from "../users/users.repository.js";
import {
  countStudents,
  countTeachers,
  countClasses,
  findAttendanceSummary,
  findOverallExamMarks,
  findStudentsWithEnrollments,
  findStudentsByTeacherClasses,
} from "./reports.repository.js";
import {
  findStudentDetail,
} from "./reports.repository.js";
import type {
  InstitutionStatResponse,
  StudentReportResponse,
  SubjectPerformance,
  StudentDetailReportResponse,
  SubjectDetail,
  AttendanceRecord,
} from "./reports.types.js";
import type { StudentReportQuery } from "./reports.validator.js";

function computeGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

function computeSubjectPerformance(
  marks: { marksObtained: number; maxMarks: number; subject: { name: string } }[],
): SubjectPerformance[] {
  const map = new Map<string, { obtained: number; max: number }>();
  for (const m of marks) {
    const entry = map.get(m.subject.name) ?? { obtained: 0, max: 0 };
    entry.obtained += Number(m.marksObtained);
    entry.max += Number(m.maxMarks);
    map.set(m.subject.name, entry);
  }
  return Array.from(map.entries()).map(([subject, { obtained, max }]) => {
    const averagePercentage = max > 0 ? Math.round((obtained / max) * 100) : 0;
    return { subject, averagePercentage, grade: computeGrade(averagePercentage) };
  });
}

function computeAttendancePercentage(
  attendances: { status: string }[],
): number {
  if (attendances.length === 0) return 0;
  const present = attendances.filter((a) => a.status === "PRESENT").length;
  return Math.round((present / attendances.length) * 100);
}

type StudentWithRelations = {
  id: string;
  firstName: string;
  lastName: string;
  enrollments?: { classId: string }[];
  attendances: { status: string }[];
  examMarks: { marksObtained: { toString: () => string }; maxMarks: { toString: () => string }; subject: { name: string } }[];
};

function toStudentReport(
  student: StudentWithRelations,
  classId?: string,
): StudentReportResponse {
  const examMarks = student.examMarks.map((m) => ({
    marksObtained: Number(m.marksObtained.toString()),
    maxMarks: Number(m.maxMarks.toString()),
    subject: m.subject,
  }));
  const subjects = computeSubjectPerformance(examMarks);
  const attendancePercentage = computeAttendancePercentage(student.attendances);
  const overallPercentage =
    subjects.length > 0
      ? Math.round(subjects.reduce((sum, s) => sum + s.averagePercentage, 0) / subjects.length)
      : 0;

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    classId: classId ?? student.enrollments?.[0]?.classId ?? "",
    attendancePercentage,
    overallPercentage,
    overallGrade: computeGrade(overallPercentage),
    subjects,
  };
}

export async function getInstitutionStats(institutionId: string): Promise<InstitutionStatResponse[]> {
  const [studentCount, teacherCount, classCount, attendanceSummary, allMarks] = await Promise.all([
    countStudents(institutionId),
    countTeachers(institutionId),
    countClasses(institutionId),
    findAttendanceSummary(institutionId),
    findOverallExamMarks(institutionId),
  ]);

  const totalAttendance = attendanceSummary.reduce((sum, a) => sum + a._count.status, 0);
  const presentCount = attendanceSummary.find((a) => a.status === "PRESENT")?._count.status ?? 0;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  const totalPossible = allMarks.reduce((s, m) => s + Number(m.maxMarks), 0);
  const passRate =
    totalPossible > 0
      ? Math.round(allMarks.filter((m) => Number(m.marksObtained) >= Number(m.maxMarks) * 0.4).length / allMarks.length * 100)
      : 0;

  return [
    { label: "Total Students", value: String(studentCount), delta: 0, trend: "up" },
    { label: "Teachers", value: String(teacherCount), delta: 0, trend: "up" },
    { label: "Classes", value: String(classCount), delta: 0, trend: "up" },
    { label: "Attendance Rate", value: `${attendanceRate}%`, delta: 0, trend: attendanceRate >= 75 ? "up" : "down" },
    { label: "Pass Rate", value: `${passRate}%`, delta: 0, trend: passRate >= 60 ? "up" : "down" },
  ];
}

export async function getStudentReports(
  institutionId: string,
  query: StudentReportQuery,
): Promise<StudentReportResponse[]> {
  const students = await findStudentsWithEnrollments(institutionId, query.classId);
  return students.map((s) => toStudentReport(s, query.classId));
}

export async function getStudentDetailReport(
  studentId: string,
  institutionId: string,
): Promise<StudentDetailReportResponse> {
  const student = await findStudentDetail(studentId, institutionId);
  if (!student) throw new NotFoundError("Student not found");

  const className = student.enrollments[0]?.class
    ? `${student.enrollments[0].class.name} · ${student.enrollments[0].class.section}`
    : "—";

  const examMarks = student.examMarks.map((m) => ({
    marksObtained: Number(m.marksObtained.toString()),
    maxMarks: Number(m.maxMarks.toString()),
    subject: m.subject.name,
    exam: m.exam,
  }));

  const subjectMap = new Map<string, { scores: { examTitle: string; term: string; date: string; marksObtained: number; maxMarks: number; percentage: number }[]; totalObtained: number; totalMax: number }>();
  for (const m of examMarks) {
    const entry = subjectMap.get(m.subject) ?? { scores: [], totalObtained: 0, totalMax: 0 };
    const percentage = m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0;
    entry.scores.push({
      examTitle: m.exam.title,
      term: m.exam.term.toLowerCase(),
      date: m.exam.startDate.toISOString().split("T")[0]!,
      marksObtained: m.marksObtained,
      maxMarks: m.maxMarks,
      percentage,
    });
    entry.totalObtained += m.marksObtained;
    entry.totalMax += m.maxMarks;
    subjectMap.set(m.subject, entry);
  }

  const subjects: SubjectDetail[] = Array.from(subjectMap.entries()).map(([subject, data]) => {
    const averagePercentage = data.totalMax > 0 ? Math.round((data.totalObtained / data.totalMax) * 100) : 0;
    return {
      subject,
      scores: data.scores,
      averagePercentage,
      grade: computeGrade(averagePercentage),
    };
  });

  const attendancePercentage = computeAttendancePercentage(student.attendances);
  const overallPercentage =
    subjects.length > 0
      ? Math.round(subjects.reduce((sum, s) => sum + s.averagePercentage, 0) / subjects.length)
      : 0;

  const recentAttendance: AttendanceRecord[] = student.attendances.slice(0, 20).map((a) => ({
    date: a.date.toISOString().split("T")[0]!,
    subject: a.subject.name,
    status: a.status.toLowerCase(),
  }));

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    admissionNumber: student.admissionNumber,
    className,
    overallAttendancePercentage: attendancePercentage,
    overallPercentage,
    overallGrade: computeGrade(overallPercentage),
    subjects,
    recentAttendance,
  };
}

export async function getTeacherStudentReports(
  teacherUserId: string,
  institutionId: string,
): Promise<StudentReportResponse[]> {
  const user = await findUserById(teacherUserId);
  if (!user?.teacherProfile) throw new NotFoundError("Teacher profile not found");

  const enrollments = await findStudentsByTeacherClasses(user.teacherProfile.id, institutionId);
  const seen = new Set<string>();
  const reports: StudentReportResponse[] = [];

  for (const tsc of enrollments) {
    for (const enrollment of tsc.class.enrollments) {
      if (seen.has(enrollment.student.id)) continue;
      seen.add(enrollment.student.id);
      reports.push(toStudentReport(enrollment.student, tsc.class.id));
    }
  }

  return reports.sort((a, b) => a.studentName.localeCompare(b.studentName));
}
