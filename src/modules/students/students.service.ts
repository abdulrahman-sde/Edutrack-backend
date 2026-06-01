import { NotFoundError, ConflictError } from "../../shared/errors/http-error.js";
import {
  findAllStudents,
  findStudentsByClass,
  findStudentById,
  createStudentWithEnrollment,
  updateStudent,
  enrollInClass,
  findEnrollment,
  findLastAdmissionNumber,
} from "./students.repository.js";
import type { CreateStudentInput, UpdateStudentInput, EnrollStudentInput } from "./students.validator.js";

function toGender(gender: string) {
  return gender.toUpperCase() as "MALE" | "FEMALE" | "OTHER";
}

function generateAdmissionNumber(lastNumber: string | null): string {
  const num = lastNumber ? parseInt(lastNumber.split("-")[1] ?? "0", 10) + 1 : 1;
  return `GR-${String(num).padStart(5, "0")}`;
}

type StudentResponse = {
  id: string;
  admissionNumber: string;
  name: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  guardianName: string | null;
  guardianPhone: string | null;
  address: string | null;
  isActive: boolean;
  classId: string | null;
  className: string | null;
  rollNumber: number | null;
  enrolledAt: string | null;
};

function toResponse(
  student: Awaited<ReturnType<typeof findAllStudents>>[number],
): StudentResponse {
  const activeEnrollment = student.enrollments[0] ?? null;
  return {
    id: student.id,
    admissionNumber: student.admissionNumber,
    name: `${student.firstName} ${student.lastName}`.trim(),
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender.toLowerCase(),
    dob: student.dob.toISOString().split("T")[0]!,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    address: student.address,
    isActive: student.isActive,
    classId: activeEnrollment?.classId ?? null,
    className: activeEnrollment ? `${activeEnrollment.class.name} · ${activeEnrollment.class.section}` : null,
    rollNumber: activeEnrollment?.rollNumber ?? null,
    enrolledAt: activeEnrollment?.enrollmentDate.toISOString().split("T")[0] ?? null,
  };
}

export async function listStudents(institutionId: string, classId?: string) {
  const students = classId
    ? await findStudentsByClass(classId)
    : await findAllStudents(institutionId);
  return students.map(toResponse);
}

export async function getStudent(id: string) {
  const student = await findStudentById(id);
  if (!student) throw new NotFoundError("Student not found");
  return toResponse(student as Parameters<typeof toResponse>[0]);
}

export async function createStudentRecord(input: CreateStudentInput, institutionId: string) {
  const lastNumber = await findLastAdmissionNumber();
  const admissionNumber = generateAdmissionNumber(lastNumber);

  const existingEnrollment = await findEnrollmentByStudentAndClass(input.firstName, input.lastName, input.classId, institutionId);
  if (existingEnrollment) {
    throw new ConflictError("A student with this name is already enrolled in this class");
  }

  const student = await createStudentWithEnrollment(
    {
      admissionNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      dob: new Date(input.dob),
      gender: toGender(input.gender),
      guardianName: input.guardianName ?? null,
      guardianPhone: input.guardianPhone ?? null,
      address: input.address ?? null,
      institutionId,
    },
    {
      classId: input.classId,
      rollNumber: input.rollNumber ?? null,
    },
  );

  const full = await findStudentById(student.id);
  return toResponse(full! as Parameters<typeof toResponse>[0]);
}

async function findEnrollmentByStudentAndClass(firstName: string, lastName: string, classId: string, institutionId: string) {
  const students = await findAllStudents(institutionId);
  const match = students.find(
    (s) =>
      s.firstName.toLowerCase() === firstName.toLowerCase() &&
      s.lastName.toLowerCase() === lastName.toLowerCase() &&
      s.enrollments.some((e) => e.classId === classId && e.status === "ACTIVE"),
  );
  return match ?? null;
}

export async function updateStudentRecord(id: string, input: UpdateStudentInput) {
  const existing = await findStudentById(id);
  if (!existing) throw new NotFoundError("Student not found");

  const updateData: Record<string, unknown> = {};
  if (input.firstName !== undefined) updateData.firstName = input.firstName;
  if (input.lastName !== undefined) updateData.lastName = input.lastName;
  if (input.dob !== undefined) updateData.dob = new Date(input.dob);
  if (input.gender !== undefined) updateData.gender = toGender(input.gender);
  if (input.guardianName !== undefined) updateData.guardianName = input.guardianName;
  if (input.guardianPhone !== undefined) updateData.guardianPhone = input.guardianPhone;
  if (input.address !== undefined) updateData.address = input.address;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const student = await updateStudent(id, updateData as Parameters<typeof updateStudent>[1]);
  return toResponse(student as Parameters<typeof toResponse>[0]);
}

export async function enrollStudentRecord(studentId: string, input: EnrollStudentInput, institutionId: string) {
  const student = await findStudentById(studentId);
  if (!student) throw new NotFoundError("Student not found");

  const existing = await findEnrollment(studentId, input.classId);
  if (existing?.status === "ACTIVE") {
    throw new ConflictError("Student is already enrolled in this class");
  }

  await enrollInClass(studentId, input.classId, institutionId, input.rollNumber ?? null);

  const full = await findStudentById(studentId);
  return toResponse(full! as Parameters<typeof toResponse>[0]);
}
