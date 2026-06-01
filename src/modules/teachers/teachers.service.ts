import bcrypt from "bcryptjs";
import { ConflictError, NotFoundError } from "../../shared/errors/http-error.js";
import { findUserByEmail } from "../users/users.repository.js";
import {
  findAllTeachers,
  createTeacherUser,
  upsertSubjectByName,
  createTeacherSubjectClasses,
  findTeacherById,
  updateTeacherProfile,
  replaceTeacherAssignments,
} from "./teachers.repository.js";
import type { CreateTeacherInput, UpdateTeacherInput } from "./teachers.validator.js";

export type TeacherListResponse = {
  id: string;
  name: string;
  email: string;
  role: "teacher";
  avatarUrl?: string;
  subjects: string[];
  classIds: string[];
  phone: string;
  joinedAt: string;
};

function toResponse(
  user: Awaited<ReturnType<typeof findAllTeachers>>[number],
): TeacherListResponse {
  const profile = user.teacherProfile!;
  return {
    id: user.id,
    name: `${profile.firstName} ${profile.lastName}`.trim(),
    email: user.email,
    role: "teacher",
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.firstName + " " + profile.lastName)}`,
    subjects: profile.teacherSubjectClasses.map((tsc) => tsc.subject.name),
    classIds: [
      ...new Set(profile.teacherSubjectClasses.map((tsc) => tsc.classId)),
    ],
    phone: profile.phone ?? "",
    joinedAt: profile.joiningDate.toISOString().split("T")[0]!,
  };
}

export async function listTeachers(institutionId: string) {
  const teachers = await findAllTeachers(institutionId);
  return teachers.map(toResponse);
}

export async function getTeacher(id: string) {
  const user = await findTeacherById(id);
  if (!user || !user.teacherProfile) throw new NotFoundError("Teacher not found");
  return toResponse(user);
}

export async function updateTeacher(id: string, input: UpdateTeacherInput, institutionId: string) {
  const existing = await findTeacherById(id);
  if (!existing || !existing.teacherProfile) throw new NotFoundError("Teacher not found");

  const { subjects, classIds, classSubjects, name, ...rest } = input;

  if (name || rest.phone !== undefined) {
    const nameParts = name ? name.split(" ") : [];
    const firstName = nameParts[0] || existing.teacherProfile.firstName;
    const lastName = nameParts.slice(1).join(" ") || existing.teacherProfile.lastName;
    await updateTeacherProfile(id, {
      firstName,
      lastName,
      phone: rest.phone !== undefined ? rest.phone : existing.teacherProfile.phone,
    });
  }

  if (classSubjects && classSubjects.length > 0) {
    const assignments: { classId: string; subjectId: string }[] = [];

    for (const cs of classSubjects) {
      for (const subjectName of cs.subjects) {
        const subject = await upsertSubjectByName(subjectName, institutionId);
        assignments.push({ classId: cs.classId, subjectId: subject.id });
      }
    }

    await replaceTeacherAssignments(existing.teacherProfile.id, assignments, institutionId);
  }

  const user = await findTeacherById(id);
  return toResponse(user!);
}

export async function createTeacherAccount(input: CreateTeacherInput, institutionId: string) {
  const existingUser = await findUserByEmail(input.email);
  if (existingUser) {
    throw new ConflictError("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const nameParts = input.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const user = await createTeacherUser(
    {
      email: input.email,
      passwordHash: hashedPassword,
      role: "TEACHER",
    },
    {
      firstName,
      lastName,
      phone: input.phone ?? null,
      employeeId: `EMP-${Date.now()}`,
      joiningDate: new Date(),
    },
    institutionId,
  );

  if (input.classIds.length > 0 && input.subjects.length > 0) {
    const tscData: { teacherId: string; classId: string; subjectId: string; institutionId: string }[] = [];

    for (const subjectName of input.subjects) {
      const subject = await upsertSubjectByName(subjectName, institutionId);
      for (const classId of input.classIds) {
        tscData.push({
          teacherId: user.teacherProfile!.id,
          classId,
          subjectId: subject.id,
          institutionId,
        });
      }
    }

    await createTeacherSubjectClasses(tscData);
  }

  const fullUser = await findTeacherById(user.id);
  if (!fullUser || !fullUser.teacherProfile) {
    return {
      id: user.id,
      name: `${firstName} ${lastName}`.trim(),
      email: user.email,
      role: "teacher" as const,
      subjects: input.subjects,
      classIds: input.classIds,
      phone: input.phone ?? "",
      joinedAt: new Date().toISOString().split("T")[0]!,
    };
  }

  return toResponse(fullUser);
}
