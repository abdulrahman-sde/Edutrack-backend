import type { Request, Response } from "express";
import { created } from "../../shared/response/index.js";
import { institutionsService } from "./institutions.service.js";
import { createInstitutionSchema } from "./institutions.validator.js";

export const institutionsController = {
  create: async (req: Request, res: Response) => {
    const input = createInstitutionSchema.parse(req.body);
    const institution = await institutionsService.create(input);
    return created(res, institution, "Institution created");
  },
};
