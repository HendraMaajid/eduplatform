CREATE INDEX CONCURRENTLY IF NOT EXISTS assignments_course_deadline_idx ON assignments(course_id, deadline) WHERE is_published = true AND deleted_at IS NULL;
