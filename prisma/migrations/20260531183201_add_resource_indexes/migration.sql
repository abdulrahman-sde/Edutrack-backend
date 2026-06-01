-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "fileName" TEXT;

-- CreateIndex
CREATE INDEX "resources_institutionId_createdAt_idx" ON "resources"("institutionId", "createdAt");

-- RenameIndex
ALTER INDEX "teacher_subject_classes_classId_teacherId_dayOfWeek_startTime_k" RENAME TO "teacher_subject_classes_classId_teacherId_dayOfWeek_startTi_key";
