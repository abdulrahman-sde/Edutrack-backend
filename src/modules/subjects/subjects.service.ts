import { findAllSubjects, createSubject } from "./subjects.repository.js";
import type { CreateSubjectInput } from "./subjects.validator.js";

export type SubjectResponse = {
  id: string;
  name: string;
  code: string;
  description: string | null;
};

function toResponse(
  subject: Awaited<ReturnType<typeof findAllSubjects>>[number],
): SubjectResponse {
  return {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description,
  };
}

export async function listSubjects(institutionId: string) {
  const subjects = await findAllSubjects(institutionId);
  return subjects.map(toResponse);
}

export async function createSubjectRecord(input: CreateSubjectInput, institutionId: string) {
  const code = input.code ?? input.name.substring(0, 4).toUpperCase() + "-" + Date.now();
  const subject = await createSubject({
    name: input.name,
    code,
    description: input.description ?? null,
    institutionId,
  });
  return toResponse(subject);
}
