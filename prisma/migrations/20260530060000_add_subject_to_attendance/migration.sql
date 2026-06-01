/*
  Make attendance per-subject

  - Add subjectId column to attendances
  - Change unique constraint from [studentId, classId, date] to [studentId, classId, subjectId, date]
  - Change index from [classId, date] to [classId, subjectId, date]
*/

-- Add subjectId column (nullable initially)
ALTER TABLE "attendances" ADD COLUMN "subjectId" UUID;

-- Backfill: assign subject from teacher_subject_classes where possible
-- If no matching TSC, use the first available subject
UPDATE "attendances" a
SET "subjectId" = (
  SELECT tsc."subjectId"
  FROM "teacher_subject_classes" tsc
  WHERE tsc."classId" = a."classId"
  LIMIT 1
);

-- Fallback for any remaining nulls: use the first subject in the system
DO $$
DECLARE
  fallback_subject_id UUID;
BEGIN
  SELECT "id" INTO fallback_subject_id FROM "subjects" LIMIT 1;
  UPDATE "attendances" SET "subjectId" = fallback_subject_id WHERE "subjectId" IS NULL;
END $$;

-- Make subjectId NOT NULL
ALTER TABLE "attendances" ALTER COLUMN "subjectId" SET NOT NULL;

-- Add FK
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old constraints
DROP INDEX IF EXISTS "attendances_classId_date_idx";
DROP INDEX IF EXISTS "attendances_studentId_classId_date_key";

-- Create new index and unique constraint
CREATE INDEX "attendances_classId_subjectId_date_idx" ON "attendances"("classId", "subjectId", "date");
CREATE UNIQUE INDEX "attendances_studentId_classId_subjectId_date_key"
  ON "attendances"("studentId", "classId", "subjectId", "date");
