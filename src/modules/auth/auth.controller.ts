import type { Request, Response } from "express";
import { loginSchema, registerAdminSchema } from "./auth.validator.js";
import { login, registerAdmin } from "./auth.service.js";
import { ok, created } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function loginController(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }

  const { token, user } = await login(parsed.data);
  ok(res, { token, user }, "Login successful");
}

export async function registerAdminController(req: Request, res: Response) {
  const parsed = registerAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }

  const { token, user } = await registerAdmin(parsed.data);
  created(res, { token, user }, "Admin registered successfully");
}

export async function logoutController(_req: Request, res: Response) {
  // Stateless — client drops the token. Nothing to do server-side.
  ok(res, null, "Logged out successfully");
}
