/*
  Warnings:

  - The `academic_terms` table and its relations are being removed.
  - The columns `academicTermId` are being dropped from `classes` and `exams`.
  - A unique constraint covering `[name,section]` on `classes` is being added.
*/

-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_academicTermId_fkey";

-- DropForeignKey
ALTER TABLE "exams" DROP CONSTRAINT "exams_academicTermId_fkey";

-- DropIndex
DROP INDEX "classes_name_section_academicTermId_key";

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "academicTermId";

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "academicTermId";

-- DropTable
DROP TABLE "academic_terms";

-- CreateIndex
CREATE UNIQUE INDEX "classes_name_section_key" ON "classes"("name", "section");
