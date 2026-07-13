ALTER TABLE platform_settings
ADD COLUMN IF NOT EXISTS description_en text NOT NULL
DEFAULT 'A 100% free technology learning platform for everyone.';
