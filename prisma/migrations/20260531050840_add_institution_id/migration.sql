/*
  Warnings:

  - Added the required column `institutionId` to the `attendances`, `classes`, `enrollments`, `exam_marks`, `exams`, `resources`, `students`, `subjects`, `teacher_profiles`, `teacher_subject_classes` tables.
  - Added the nullable column `institutionId` to `users`.
*/

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_subjectId_fkey";

-- Step 1: Add columns as nullable
ALTER TABLE "attendances" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "classes" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "enrollments" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "exam_marks" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "exams" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "resources" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "students" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "subjects" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "teacher_profiles" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "teacher_subject_classes" ADD COLUMN     "institutionId" UUID;
ALTER TABLE "users" ADD COLUMN     "institutionId" UUID;

-- Step 2: Backfill users — admins get their own institution
UPDATE "users" SET "institutionId" = (
  SELECT i."id" FROM "institutions" i WHERE i."createdById" = "users"."id"
) WHERE "role" = 'ADMIN';

-- Step 3: Backfill users — teachers get the same institution as the first admin
UPDATE "users" SET "institutionId" = (
  SELECT u2."institutionId" FROM "users" u2 WHERE u2."role" = 'ADMIN' AND u2."institutionId" IS NOT NULL LIMIT 1
) WHERE "role" = 'TEACHER' AND "institutionId" IS NULL;

-- Step 4: Backfill teacher_profiles from their user
UPDATE "teacher_profiles" SET "institutionId" = (
  SELECT u."institutionId" FROM "users" u WHERE u."id" = "teacher_profiles"."userId"
);

-- Step 5: Backfill entity tables — use any available institution (all seed data is from one school)
UPDATE "classes" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);
UPDATE "subjects" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);
UPDATE "students" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);
UPDATE "enrollments" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);
UPDATE "exams" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);
UPDATE "exam_marks" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);
UPDATE "resources" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);
UPDATE "attendances" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);
UPDATE "teacher_subject_classes" SET "institutionId" = (SELECT "id" FROM "institutions" LIMIT 1);

-- Step 6: Make columns required (except users — nullable for backward compat)
ALTER TABLE "teacher_profiles" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "classes" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "subjects" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "enrollments" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "exams" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "exam_marks" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "resources" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "attendances" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "teacher_subject_classes" ALTER COLUMN "institutionId" SET NOT NULL;

-- Step 7: Foreign keys
ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "classes" ADD CONSTRAINT "classes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_subject_classes" ADD CONSTRAINT "teacher_subject_classes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exams" ADD CONSTRAINT "exams_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "resources" ADD CONSTRAINT "resources_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
