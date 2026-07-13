CREATE INDEX CONCURRENTLY IF NOT EXISTS courses_published_created_idx ON courses(created_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
