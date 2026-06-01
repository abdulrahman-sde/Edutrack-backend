import { prisma } from "../../lib/prisma.js";
import type { ResourceType } from "../../generated/prisma/client.js";

const resourceInclude = {
  class: { select: { id: true, name: true, section: true } },
  subject: { select: { id: true, name: true } },
  uploader: {
    select: {
      id: true,
      email: true,
      teacherProfile: { select: { firstName: true, lastName: true } },
      adminProfile: { select: { firstName: true, lastName: true } },
    },
  },
} as const;

export async function findResourcesByTeacher(
  teacherProfileId: string,
  institutionId: string,
) {
  return prisma.resource.findMany({
    where: {
      institutionId,
      class: {
        teacherSubjectClasses: {
          some: { teacherId: teacherProfileId },
        },
      },
    },
    include: resourceInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findResourceById(id: string) {
  return prisma.resource.findUnique({
    where: { id },
    include: resourceInclude,
  });
}

export async function createResource(data: {
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string | null;
  dueDate: Date | null;
  type: ResourceType;
  classId: string;
  subjectId: string;
  uploaderId: string;
  institutionId: string;
}) {
  return prisma.resource.create({
    data,
    include: resourceInclude,
  });
}

export async function updateResource(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    fileUrl?: string;
    fileName?: string | null;
    dueDate?: Date | null;
    type?: ResourceType;
    subjectId?: string;
  },
) {
  return prisma.resource.update({
    where: { id },
    data,
    include: resourceInclude,
  });
}

export async function deleteResource(id: string) {
  return prisma.resource.delete({ where: { id } });
}

export async function findResourcesByClass(
  classId: string,
  institutionId: string,
) {
  return prisma.resource.findMany({
    where: { classId, institutionId },
    include: resourceInclude,
    orderBy: { createdAt: "desc" },
  });
}
