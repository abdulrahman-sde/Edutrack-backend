import { NotFoundError } from "../../shared/errors/http-error.js";
import {
  findAllClasses,
  findClassesByTeacher,
  findClassById,
  createClass,
  updateClass,
  deleteClass,
  findTeacherProfileByUserId,
  upsertSubjectByName,
  replaceTeacherSubjectClasses,
} from "./classes.repository.js";
import type { CreateClassInput, UpdateClassInput } from "./classes.validator.js";

export type SubjectTeacherAssignment = {
  subject: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type ClassResponse = {
  id: string;
  name: string;
  section: string;
  subjectTeachers: SubjectTeacherAssignment[];
  studentCount: number;
};

function toResponse(cls: Awaited<ReturnType<typeof findAllClasses>>[number]): ClassResponse {
  return {
    id: cls.id,
    name: cls.name,
    section: cls.section,
    subjectTeachers: cls.teacherSubjectClasses.map((tsc) => ({
      subject: tsc.subject.name,
      teacherId: tsc.teacher.userId,
      teacherName: `${tsc.teacher.firstName} ${tsc.teacher.lastName}`.trim(),
      dayOfWeek: tsc.dayOfWeek,
      startTime: tsc.startTime,
      endTime: tsc.endTime,
    })),
    studentCount: cls.enrollments.length,
  };
}

export async function listClasses(institutionId: string, scope?: string, userId?: string) {
  if (scope === "teacher" && userId) {
    const profile = await findTeacherProfileByUserId(userId);
    if (!profile) throw new NotFoundError("Teacher profile not found");
    const classes = await findClassesByTeacher(profile.id, institutionId);
    return classes.map(toResponse);
  }

  const classes = await findAllClasses(institutionId);
  return classes.map(toResponse);
}

export async function getClass(id: string) {
  const cls = await findClassById(id);
  if (!cls) throw new NotFoundError("Class not found");
  return toResponse(cls);
}

export async function createClassRecord(input: CreateClassInput, institutionId: string) {
  const cls = await createClass({ ...input, institutionId });
  return toResponse(cls);
}

export async function updateClassRecord(id: string, input: UpdateClassInput, institutionId: string) {
  const existing = await findClassById(id);
  if (!existing) throw new NotFoundError("Class not found");

  const { subjectTeachers, ...classData } = input;

  if (Object.keys(classData).length > 0) {
    await updateClass(id, classData);
  }

  if (subjectTeachers) {
    const assignments = await Promise.all(
      subjectTeachers.map(async (st) => {
        const subject = await upsertSubjectByName(st.subject, institutionId);
        const profile = await findTeacherProfileByUserId(st.teacherId);
        if (!profile) throw new NotFoundError(`Teacher profile not found for user ${st.teacherId}`);
        return { teacherId: profile.id, subjectId: subject.id, dayOfWeek: st.dayOfWeek ?? null, startTime: st.startTime ?? null, endTime: st.endTime ?? null };
      }),
    );

    await replaceTeacherSubjectClasses(id, assignments, institutionId);
  }

  const cls = await findClassById(id);
  return toResponse(cls!);
}

export async function deleteClassRecord(id: string) {
  const existing = await findClassById(id);
  if (!existing) throw new NotFoundError("Class not found");
  await deleteClass(id);
}
