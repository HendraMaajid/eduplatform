CREATE INDEX CONCURRENTLY IF NOT EXISTS notifications_user_unread_created_idx ON notifications(user_id, created_at DESC) WHERE is_read = false;
