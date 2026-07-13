CREATE INDEX CONCURRENTLY IF NOT EXISTS users_email_trgm_idx ON users USING gin (email gin_trgm_ops) WHERE deleted_at IS NULL;
