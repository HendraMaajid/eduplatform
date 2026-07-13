ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS issuer text NOT NULL DEFAULT 'EduPlatform';
