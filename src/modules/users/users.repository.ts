import { prisma } from "../../lib/prisma.js";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      adminProfile: true,
      teacherProfile: true,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      adminProfile: true,
      teacherProfile: true,
    },
  });
}
