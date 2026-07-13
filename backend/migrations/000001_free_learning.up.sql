BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';

-- The product decision is a full reset of historic student learning activity.
DO $$
BEGIN
  IF to_regclass('public.quiz_answers') IS NOT NULL THEN
    DELETE FROM quiz_answers;
  END IF;
  IF to_regclass('public.quiz_attempts') IS NOT NULL THEN
    DELETE FROM quiz_attempts;
  END IF;
  IF to_regclass('public.submissions') IS NOT NULL THEN
    DELETE FROM submissions;
  END IF;
  IF to_regclass('public.certificates') IS NOT NULL THEN
    DELETE FROM certificates;
  END IF;
  IF to_regclass('public.notifications') IS NOT NULL THEN
    DELETE FROM notifications;
  END IF;
END $$;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS enrollments;
ALTER TABLE IF EXISTS courses DROP COLUMN IF EXISTS price;

CREATE TABLE IF NOT EXISTS learning_progresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'certified')),
  last_module_id uuid REFERENCES modules(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learning_progresses_student_course_key UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS learning_progresses_course_id_idx ON learning_progresses(course_id);
CREATE INDEX IF NOT EXISTS learning_progresses_student_access_idx ON learning_progresses(student_id, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS learning_progresses_last_module_id_idx ON learning_progresses(last_module_id);

CREATE TABLE IF NOT EXISTS platform_settings (
  id bigint PRIMARY KEY CHECK (id = 1),
  name text NOT NULL DEFAULT 'EduPlatform',
  description text NOT NULL DEFAULT 'Platform belajar teknologi 100% gratis untuk semua.',
  support_email text NOT NULL DEFAULT 'support@eduplatform.id',
  logo_url text NOT NULL DEFAULT '',
  default_locale text NOT NULL DEFAULT 'id' CHECK (default_locale IN ('id', 'en')),
  certificate_issuer text NOT NULL DEFAULT 'EduPlatform',
  notify_new_registration boolean NOT NULL DEFAULT true,
  notify_new_submission boolean NOT NULL DEFAULT true,
  notify_grade_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  locale text NOT NULL DEFAULT 'id' CHECK (locale IN ('id', 'en')),
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notify_course_updates boolean NOT NULL DEFAULT true,
  notify_assignments boolean NOT NULL DEFAULT true,
  notify_grades boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO user_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
