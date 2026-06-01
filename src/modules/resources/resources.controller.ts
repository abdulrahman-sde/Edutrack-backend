import type { Request, Response } from "express";
import {
  createResourceSchema,
  updateResourceSchema,
} from "./resources.validator.js";
import {
  listMyResources,
  createResourceRecord,
  updateResourceRecord,
  deleteResourceRecord,
} from "./resources.service.js";
import { ok, created, noContent } from "../../shared/response/index.js";
import { ValidationError } from "../../shared/errors/http-error.js";

export async function listResourcesController(req: Request, res: Response) {
  const records = await listMyResources(
    req.user!.sub,
    req.user!.institutionId,
  );
  ok(res, records);
}

export async function createResourceController(req: Request, res: Response) {
  const parsed = createResourceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const file = req.file;
  const input: Record<string, unknown> = { ...parsed.data };
  if (file) {
    input.fileBuffer = file.buffer;
    input.originalFileName = file.originalname;
  }
  const resource = await createResourceRecord(
    input as any,
    req.user!.sub,
    req.user!.institutionId,
  );
  created(res, resource, "Resource created");
}

export async function updateResourceController(req: Request, res: Response) {
  const parsed = updateResourceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  const resource = await updateResourceRecord(
    req.params.id as string,
    parsed.data,
    req.user!.sub,
    req.user!.institutionId,
  );
  ok(res, resource, "Resource updated");
}

export async function deleteResourceController(req: Request, res: Response) {
  await deleteResourceRecord(req.params.id as string, req.user!.sub);
  noContent(res);
}
