/*
  Warnings:

  - You are about to drop the column `name` on the `exams` table. All the data in the column will be lost.
  - Added the required column `term` to the `exams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `exams` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExamTerm" AS ENUM ('MONTHLY', 'MIDTERM', 'PRE_BOARD', 'FINAL');

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "name",
ADD COLUMN     "term" "ExamTerm" NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "exam_classes" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,

    CONSTRAINT "exam_classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_classes_examId_classId_key" ON "exam_classes"("examId", "classId");

-- AddForeignKey
ALTER TABLE "exam_classes" ADD CONSTRAINT "exam_classes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_classes" ADD CONSTRAINT "exam_classes_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_classes" ADD CONSTRAINT "exam_classes_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
