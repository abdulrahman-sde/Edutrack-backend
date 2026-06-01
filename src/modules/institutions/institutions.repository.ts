import { prisma } from "../../lib/prisma.js";

export const institutionsRepository = {
  create: async (name: string) => {
    return prisma.institution.create({
      data: {
        name,
      },
    });
  },
  findById: async (id: string) => {
    return prisma.institution.findUnique({ where: { id } });
  },
  findFirst: async () => {
    return prisma.institution.findFirst({ orderBy: { createdAt: "asc" } });
  },
  findByCreatedById: async (createdById: string) => {
    return prisma.institution.findFirst({
      where: {
        createdById,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },
};
