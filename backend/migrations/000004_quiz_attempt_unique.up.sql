CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS quiz_attempts_student_quiz_uidx ON quiz_attempts(student_id, quiz_id);
