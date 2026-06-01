/*
  Allow a teacher to have multiple periods in the same class.

  Changes unique constraint from (classId, teacherId) to
  (classId, teacherId, dayOfWeek, startTime).

  This prevents time-slot conflicts while allowing a teacher
  to teach multiple periods (same or different subjects) in a class.
*/

-- Drop old unique constraint (one teacher per class)
DROP INDEX IF EXISTS "teacher_subject_classes_classId_teacherId_key";

-- Add new unique constraint (prevents double-booking at same time)
CREATE UNIQUE INDEX "teacher_subject_classes_classId_teacherId_dayOfWeek_startTime_key"
  ON "teacher_subject_classes"("classId", "teacherId", "dayOfWeek", "startTime");
