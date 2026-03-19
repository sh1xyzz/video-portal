-- ============================================================
-- Migration: Role System + Enrollment + CourseAssignment
-- Запускать ОДИН РАЗ через psql или pgAdmin
-- ============================================================

-- 1. Создаём ENUM тип для ролей
DO $$ BEGIN
  CREATE TYPE userrole AS ENUM ('admin', 'teacher', 'assistant', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Добавляем role в users
--    Если is_admin=true → admin, иначе → student
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role userrole NOT NULL DEFAULT 'student';

-- Переносим is_admin → role (если столбец есть)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='is_admin'
  ) THEN
    UPDATE users SET role = 'admin' WHERE is_admin = true;
    -- is_admin оставляем для обратной совместимости, можно удалить потом:
    -- ALTER TABLE users DROP COLUMN is_admin;
  END IF;
END $$;

-- 3. Переименовываем password → hashed_password (если нужно)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='password'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='hashed_password'
  ) THEN
    ALTER TABLE users RENAME COLUMN password TO hashed_password;
  END IF;
END $$;

-- 4. Добавляем bio в users если нет
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Добавляем owner_id и coin_price в courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS coin_price INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_courses_owner_id ON courses(owner_id);

-- 6. Таблица enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- 7. Таблица course_assignments (ассистент → курс)
CREATE TABLE IF NOT EXISTS course_assignments (
  id         SERIAL PRIMARY KEY,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_assignment UNIQUE (course_id, user_id)
);

-- 8. ENUM для статуса заданий
DO $$ BEGIN
  CREATE TYPE submissionstatus AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 9. Таблица task_submissions
CREATE TABLE IF NOT EXISTS task_submissions (
  id           SERIAL PRIMARY KEY,
  lesson_id    INTEGER NOT NULL REFERENCES lessons(id)  ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  reviewer_id  INTEGER          REFERENCES users(id)    ON DELETE SET NULL,
  content      TEXT NOT NULL,
  status       submissionstatus NOT NULL DEFAULT 'pending',
  feedback     TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_submissions_lesson_id ON task_submissions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id   ON task_submissions(user_id);

-- 10. Добавляем FK на users.id в lesson_progress (если раньше был без FK)
--     Сначала убираем строки с несуществующими user_id
DELETE FROM lesson_progress
  WHERE user_id NOT IN (SELECT id FROM users);

-- Добавляем FK если его нет
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lesson_progress_user_id_fkey'
      AND table_name = 'lesson_progress'
  ) THEN
    ALTER TABLE lesson_progress
      ADD CONSTRAINT lesson_progress_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 11. Первый admin — установить вручную по email:
-- UPDATE users SET role = 'admin' WHERE email = 'your@email.com';

-- ============================================================
-- ГОТОВО. Перезапусти бэкенд: uvicorn app.main:app --reload
-- ============================================================