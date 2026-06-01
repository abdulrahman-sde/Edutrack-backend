import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  UnauthorizedError,
  ConflictError,
} from "../../shared/errors/http-error.js";
import type { JwtPayload, Role } from "../../shared/types/jwt.js";
import type { LoginInput, RegisterAdminInput } from "./auth.validator.js";
import { createAdminUser } from "./auth.repository.js";
import { findUserByEmail } from "../users/users.repository.js";

export function generateToken(
  userId: string,
  email: string,
  name: string,
  role: Role,
  institutionId: string,
) {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET is not set");

  const payload: JwtPayload = { sub: userId, role, email, name, institutionId };
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);

  if (!user || user.role.toLowerCase() !== input.role) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const profile =
    user.role === "ADMIN" ? user.adminProfile : user.teacherProfile;
  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "Unknown User";

  let institutionId = user.institutionId;
  let institutionName: string | undefined;

  if (institutionId) {
    // Import lazily to avoid circular deps
    const { institutionsRepository } = await import("../institutions/institutions.repository.js");
    const inst = await institutionsRepository.findById(institutionId);
    institutionName = inst?.name;
  } else {
    // Backward compat — fallback for users without institutionId
    const { institutionsRepository } = await import("../institutions/institutions.repository.js");
    const inst = user.role === "ADMIN"
      ? await institutionsRepository.findByCreatedById(user.id)
      : null;
    if (inst) {
      institutionId = inst.id;
      institutionName = inst.name;
    } else {
      // Last resort — pick any institution
      const anyInst = await institutionsRepository.findFirst();
      institutionId = anyInst?.id ?? "";
      institutionName = anyInst?.name;
    }
  }

  const token = generateToken(
    user.id,
    user.email,
    fullName,
    input.role as Role,
    institutionId,
  );

  return {
    token,
    user: {
      id: user.id,
      name: fullName,
      email: user.email,
      role: input.role,
      institutionName,
    },
  };
}

export async function registerAdmin(input: RegisterAdminInput) {
  const existingUser = await findUserByEmail(input.email);
  if (existingUser) {
    throw new ConflictError("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const nameParts = input.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const institutionName = input.institutionName.trim();
  const user = await createAdminUser(
    {
      email: input.email,
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
    {
      firstName,
      lastName,
    },
    institutionName,
  );

  const token = generateToken(
    user.id,
    user.email,
    input.name,
    "admin",
    user.institutionId!,
  );

  return {
    token,
    user: {
      id: user.id,
      name: input.name,
      email: user.email,
      role: "admin" as const,
      institutionName,
    },
  };
}
