CREATE INDEX CONCURRENTLY IF NOT EXISTS courses_title_trgm_idx ON courses USING gin (title gin_trgm_ops) WHERE deleted_at IS NULL;
