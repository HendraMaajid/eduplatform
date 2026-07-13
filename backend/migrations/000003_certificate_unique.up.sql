CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS certificates_student_course_uidx ON certificates(student_id, course_id);
