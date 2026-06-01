/*
  One teacher, one subject per class policy.

  Changes unique constraint on teacher_subject_classes from
  (classId, subjectId) → (classId, teacherId)

  This ensures a teacher can only teach one subject in a given class.
  Multiple teachers can still teach different subjects in the same class.
*/

-- Drop old unique constraint (one subject per class)
DROP INDEX IF EXISTS "teacher_subject_classes_classId_subjectId_key";

-- Add new unique constraint (one teacher per class-assignment)
CREATE UNIQUE INDEX "teacher_subject_classes_classId_teacherId_key"
  ON "teacher_subject_classes"("classId", "teacherId");
