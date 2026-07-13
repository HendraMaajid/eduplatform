BEGIN;

DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS platform_settings;
DROP TABLE IF EXISTS learning_progresses;

ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS price bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_amount bigint NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0,
  completed_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT enrollments_student_course_key UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS enrollments_course_id_idx ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS enrollments_student_id_idx ON enrollments(student_id);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount bigint NOT NULL DEFAULT 0,
  paid_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_student_course_key UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS payments_course_id_idx ON payments(course_id);
CREATE INDEX IF NOT EXISTS payments_student_id_idx ON payments(student_id);

COMMIT;
