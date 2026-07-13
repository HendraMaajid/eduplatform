CREATE INDEX CONCURRENTLY IF NOT EXISTS users_name_trgm_idx ON users USING gin (name gin_trgm_ops) WHERE deleted_at IS NULL;
