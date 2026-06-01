import { prisma } from "../../lib/prisma.js";

export async function findAllSubjects(institutionId: string) {
  return prisma.subject.findMany({
    where: { institutionId },
    orderBy: { name: "asc" },
  });
}

export async function createSubject(data: { name: string; code: string; description?: string | null; institutionId: string }) {
  return prisma.subject.create({ data });
}
