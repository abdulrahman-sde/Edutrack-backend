import { institutionsRepository } from "./institutions.repository.js";
import type { CreateInstitutionInput } from "./institutions.validator.js";

export const institutionsService = {
  create: async (input: CreateInstitutionInput) => {
    return institutionsRepository.create(input.name.trim());
  },
};
