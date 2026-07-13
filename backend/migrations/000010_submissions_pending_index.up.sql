CREATE INDEX CONCURRENTLY IF NOT EXISTS submissions_pending_idx ON submissions(submitted_at DESC) WHERE status = 'submitted' AND deleted_at IS NULL;
