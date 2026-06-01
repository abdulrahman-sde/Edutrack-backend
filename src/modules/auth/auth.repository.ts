import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export async function createAdminUser(
  userData: { email: string; passwordHash: string; role: "ADMIN" },
  profileData: { firstName: string; lastName: string },
  institutionName: string,
) {
  const institution = await prisma.institution.create({
    data: { name: institutionName },
  });

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role,
      institutionId: institution.id,
      adminProfile: {
        create: profileData,
      },
    },
    include: {
      adminProfile: true,
    },
  });

  await prisma.institution.update({
    where: { id: institution.id },
    data: { createdById: user.id },
  });

  return user;
}
