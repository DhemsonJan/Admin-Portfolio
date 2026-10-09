import { getDb } from './index.js';

/**
 * Schema is intentionally idempotent so the server can boot against a fresh
 * database with zero manual steps. The two dialects share the same shape;
 * only the column types differ.
 */
const SQLITE_DDL = `
CREATE TABLE IF NOT EXISTS projects (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  full_description  TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL DEFAULT 'Other',
  categories        TEXT NOT NULL DEFAULT '[]',
  technologies      TEXT NOT NULL DEFAULT '[]',
  key_features      TEXT NOT NULL DEFAULT '[]',
  problem           TEXT NOT NULL DEFAULT '',
  solution          TEXT NOT NULL DEFAULT '',
  contribution      TEXT NOT NULL DEFAULT '',
  role              TEXT NOT NULL DEFAULT '',
  project_year      INTEGER,
  github_url        TEXT,
  demo_url          TEXT,
  video_url         TEXT,
  video_type        TEXT NOT NULL DEFAULT 'none',
  thumbnail_url     TEXT,
  gallery           TEXT NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'draft',
  featured          INTEGER NOT NULL DEFAULT 0,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status  ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_order   ON projects (sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_feature ON projects (featured);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  success     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_attempts_fingerprint ON login_attempts (fingerprint, created_at);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_created ON contact_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status  ON contact_messages (status);
`;

const POSTGRES_DDL = `
CREATE TABLE IF NOT EXISTS projects (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  full_description  TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL DEFAULT 'Other',
  categories        TEXT NOT NULL DEFAULT '[]',
  technologies      TEXT NOT NULL DEFAULT '[]',
  key_features      TEXT NOT NULL DEFAULT '[]',
  problem           TEXT NOT NULL DEFAULT '',
  solution          TEXT NOT NULL DEFAULT '',
  contribution      TEXT NOT NULL DEFAULT '',
  role              TEXT NOT NULL DEFAULT '',
  project_year      INTEGER,
  github_url        TEXT,
  demo_url          TEXT,
  video_url         TEXT,
  video_type        TEXT NOT NULL DEFAULT 'none',
  thumbnail_url     TEXT,
  gallery           TEXT NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'draft',
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status  ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_order   ON projects (sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_feature ON projects (featured);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id          BIGSERIAL PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_attempts_fingerprint ON login_attempts (fingerprint, created_at);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_created ON contact_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status  ON contact_messages (status);
`;

/**
 * Additive column migration.
 *
 * `CREATE TABLE IF NOT EXISTS` leaves an existing table alone, so new columns
 * have to be added explicitly or an older database silently keeps its old shape.
 * Both engines report an already-existing column as an error with different
 * wording, so the error is inspected rather than assumed.
 */
const ALREADY_EXISTS = /already exists|duplicate column/i;

async function addColumn(db, table, column, definition) {
  try {
    await db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    return true;
  } catch (error) {
    if (ALREADY_EXISTS.test(error.message ?? '')) return false;
    throw error;
  }
}

export async function migrate() {
  const db = await getDb();
  await db.exec(db.kind === 'postgres' ? POSTGRES_DDL : SQLITE_DDL);

  // Case-study fields for the featured-project section. Safe on both dialects.
  const text = db.kind === 'postgres' ? 'TEXT NOT NULL DEFAULT \'\'' : "TEXT NOT NULL DEFAULT ''";
  for (const column of ['problem', 'solution', 'contribution']) {
    await addColumn(db, 'projects', column, text);
  }

  // Postgres has no AUTOINCREMENT equivalent issue, but the SQLite driver needs
  // the AUTOINCREMENT keyword on the attempts table - already declared above.
  if (db.kind === 'postgres') {
    await db.exec(`ALTER TABLE projects ALTER COLUMN featured TYPE BOOLEAN USING featured::boolean;`);
  }

  return db;
}

export async function purgeExpiredSessions() {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.run('DELETE FROM admin_sessions WHERE expires_at < ?', [now]);
  await db.run(
    "DELETE FROM login_attempts WHERE created_at < ?",
    [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()],
  );
}