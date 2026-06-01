import { NotFoundError } from "../../shared/errors/http-error.js";
import { upsertSubjectByName, findTeacherProfileByUserId } from "../classes/classes.repository.js";
import { uploadToCloudinary } from "../../lib/cloudinary.js";
import {
  findResourcesByTeacher,
  findResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "./resources.repository.js";
import type { CreateResourceInput, UpdateResourceInput } from "./resources.validator.js";

const TYPE_MAP: Record<string, string> = {
  assignment: "ASSIGNMENT",
  material: "STUDY_MATERIAL",
};

const TYPE_UNMAP: Record<string, string> = {
  ASSIGNMENT: "assignment",
  STUDY_MATERIAL: "material",
  SYLLABUS: "syllabus",
};

type ResourceResponse = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string | null;
  dueDate: string | null;
  type: string;
  classId: string;
  className: string;
  classSection: string;
  subject: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
  updatedAt: string;
};

function toResponse(
  resource: Awaited<ReturnType<typeof findResourcesByTeacher>>[number],
): ResourceResponse {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    fileUrl: resource.fileUrl,
    fileName: resource.fileName,
    dueDate: resource.dueDate ? resource.dueDate.toISOString().split("T")[0]! : null,
    type: TYPE_UNMAP[resource.type] ?? resource.type.toLowerCase(),
    classId: resource.classId,
    className: resource.class.name,
    classSection: resource.class.section,
    subject: resource.subject.name,
    uploaderId: resource.uploaderId,
    uploaderName: resource.uploader.teacherProfile
      ? `${resource.uploader.teacherProfile.firstName} ${resource.uploader.teacherProfile.lastName}`
      : resource.uploader.adminProfile
        ? `${resource.uploader.adminProfile.firstName} ${resource.uploader.adminProfile.lastName}`
        : resource.uploader.email,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  };
}

export async function listMyResources(userId: string, institutionId: string) {
  const profile = await findTeacherProfileByUserId(userId);
  if (!profile) throw new NotFoundError("Teacher profile not found");
  const records = await findResourcesByTeacher(profile.id, institutionId);
  return records.map(toResponse);
}

export async function createResourceRecord(
  input: CreateResourceInput & { fileBuffer?: Buffer; originalFileName?: string },
  userId: string,
  institutionId: string,
) {
  const dbType = TYPE_MAP[input.type];
  if (!dbType) throw new Error(`Invalid type: ${input.type}`);

  const subject = await upsertSubjectByName(input.subject, institutionId);

  let fileUrl = "";
  let fileName: string | null = null;

  if (input.fileBuffer) {
    const folder = `edutrack/${institutionId}/resources`;
    const result = await uploadToCloudinary(input.fileBuffer, folder);
    fileUrl = result.url;
    fileName = input.originalFileName ?? null;
  }

  const resource = await createResource({
    title: input.title,
    description: input.description ?? null,
    fileUrl,
    fileName,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    type: dbType as any,
    classId: input.classId,
    subjectId: subject.id,
    uploaderId: userId,
    institutionId,
  });

  return toResponse(resource);
}

export async function updateResourceRecord(
  resourceId: string,
  input: UpdateResourceInput,
  userId: string,
  institutionId: string,
) {
  const existing = await findResourceById(resourceId);
  if (!existing) throw new NotFoundError("Resource not found");

  let subjectId = existing.subjectId;
  if (input.subject) {
    const subject = await upsertSubjectByName(input.subject, institutionId);
    subjectId = subject.id;
  }

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description ?? null;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.type !== undefined) data.type = TYPE_MAP[input.type] as string;
  data.subjectId = subjectId;

  const updated = await updateResource(resourceId, data as any);

  return toResponse(updated);
}

export async function deleteResourceRecord(resourceId: string, userId: string) {
  const existing = await findResourceById(resourceId);
  if (!existing) throw new NotFoundError("Resource not found");

  await deleteResource(resourceId);
}
