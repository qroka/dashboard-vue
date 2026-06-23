-- Роль assistant (помощник заместителя, CRM u_prem9 = 4).
-- SQLite не позволяет расширить CHECK — пересоздаём таблицу users.

CREATE TABLE users_role_assistant_migration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'moderator', 'assistant', 'user')),
  external_user_id INTEGER,
  substitute_slug TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  theme_primary TEXT,
  theme_neutral TEXT,
  theme_color_mode TEXT CHECK (
    theme_color_mode IS NULL OR theme_color_mode IN ('light', 'dark', 'auto')
  )
);

INSERT INTO users_role_assistant_migration (
  id, login, password_hash, name, email, role, external_user_id, substitute_slug, created_at,
  theme_primary, theme_neutral, theme_color_mode
)
SELECT
  id, login, password_hash, name, email, role, external_user_id, substitute_slug, created_at,
  theme_primary, theme_neutral, theme_color_mode
FROM users;

DROP TABLE users;
ALTER TABLE users_role_assistant_migration RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_substitute_slug ON users(substitute_slug);
