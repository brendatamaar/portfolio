/**
 * Runs schema creation inline (no migration files needed for initial setup).
 * Called once at server startup.
 */

import { sqlite } from './index.js'

export function runMigrations(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS posts (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title           TEXT NOT NULL,
      slug            TEXT NOT NULL UNIQUE,
      description     TEXT NOT NULL DEFAULT '',
      content         TEXT NOT NULL DEFAULT '',
      status          TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
      cover_image_url TEXT,
      published_at    INTEGER,
      created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS tags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS images (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      filename      TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mime_type     TEXT NOT NULL,
      size_bytes    INTEGER NOT NULL,
      url           TEXT NOT NULL,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS books (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      author     TEXT NOT NULL,
      cover_url  TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS albums (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      artist     TEXT NOT NULL,
      cover_url  TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `)

  // Add i18n columns to existing posts table (SQLite has no IF NOT EXISTS for ALTER TABLE)
  for (const col of [
    "title_id TEXT NOT NULL DEFAULT ''",
    "description_id TEXT NOT NULL DEFAULT ''",
    "content_id TEXT NOT NULL DEFAULT ''",
  ]) {
    try {
      sqlite.exec(`ALTER TABLE posts ADD COLUMN ${col}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('duplicate column')) throw err
    }
  }

  // Add glossary and bibliography columns
  for (const col of [
    "glossary_en TEXT NOT NULL DEFAULT '[]'",
    'glossary_id TEXT',
    "bibliography_en TEXT NOT NULL DEFAULT '[]'",
    'bibliography_id TEXT',
  ]) {
    try {
      sqlite.exec(`ALTER TABLE posts ADD COLUMN ${col}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('duplicate column')) throw err
    }
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      locale               TEXT PRIMARY KEY CHECK(locale IN ('en', 'id')),
      name                 TEXT NOT NULL,
      initials             TEXT NOT NULL DEFAULT '',
      location             TEXT NOT NULL DEFAULT '',
      location_link        TEXT NOT NULL DEFAULT '',
      current_job          TEXT NOT NULL DEFAULT '',
      description          TEXT NOT NULL DEFAULT '',
      about                TEXT NOT NULL DEFAULT '',
      summary              TEXT NOT NULL DEFAULT '',
      avatar_url           TEXT NOT NULL DEFAULT '',
      personal_website_url TEXT NOT NULL DEFAULT '',
      email                TEXT NOT NULL DEFAULT '',
      tel                  TEXT NOT NULL DEFAULT '',
      social               TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS resume_work (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      locale      TEXT NOT NULL CHECK(locale IN ('en', 'id')),
      company     TEXT NOT NULL,
      link        TEXT NOT NULL DEFAULT '',
      badge       TEXT NOT NULL DEFAULT '',
      title       TEXT NOT NULL,
      start       TEXT NOT NULL,
      end         TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS resume_education (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      locale      TEXT NOT NULL CHECK(locale IN ('en', 'id')),
      school      TEXT NOT NULL,
      degree      TEXT NOT NULL,
      start       TEXT NOT NULL,
      end         TEXT NOT NULL,
      desc        TEXT NOT NULL DEFAULT '',
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS resume_skills (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS resume_projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      locale      TEXT NOT NULL CHECK(locale IN ('en', 'id')),
      title       TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('side_project', 'work')),
      company     TEXT,
      tech_stack  TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL DEFAULT '',
      link_label  TEXT,
      link_href   TEXT,
      img         TEXT NOT NULL DEFAULT '',
      is_featured INTEGER NOT NULL DEFAULT 0,
      sort_order  INTEGER NOT NULL DEFAULT 0
    );
  `)

  // Add status + year to books, year to albums, featured to both
  for (const stmt of [
    `ALTER TABLE books ADD COLUMN status TEXT NOT NULL DEFAULT 'finished'`,
    `ALTER TABLE books ADD COLUMN year INTEGER`,
    `ALTER TABLE albums ADD COLUMN year INTEGER`,
    `ALTER TABLE books ADD COLUMN featured INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE albums ADD COLUMN featured INTEGER NOT NULL DEFAULT 0`,
  ]) {
    try {
      sqlite.exec(stmt)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('duplicate column')) throw err
    }
  }

  // Item 46: Make bilingual post columns nullable (NULL = no translation, '' was ambiguous)
  // Uses a version key so this destructive recreation only runs once.
  const bilingualMigrated = sqlite
    .prepare(
      "SELECT value FROM app_settings WHERE key = 'schema_posts_bilingual_nullable_v1'",
    )
    .get() as { value: string } | undefined

  if (!bilingualMigrated) {
    sqlite.pragma('foreign_keys = OFF')
    sqlite.exec(`
      BEGIN;
      CREATE TABLE posts_new (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        title           TEXT NOT NULL,
        slug            TEXT NOT NULL UNIQUE,
        description     TEXT NOT NULL DEFAULT '',
        content         TEXT NOT NULL DEFAULT '',
        status          TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
        cover_image_url TEXT,
        published_at    INTEGER,
        created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at      INTEGER NOT NULL DEFAULT (unixepoch()),
        title_id        TEXT,
        description_id  TEXT,
        content_id      TEXT
      );
      INSERT INTO posts_new
        SELECT id, title, slug, description, content, status, cover_image_url, published_at,
               created_at, updated_at,
               NULLIF(title_id, ''), NULLIF(description_id, ''), NULLIF(content_id, '')
        FROM posts;
      DROP TABLE posts;
      ALTER TABLE posts_new RENAME TO posts;
      COMMIT;
    `)
    sqlite.pragma('foreign_keys = ON')
    sqlite
      .prepare(
        "INSERT INTO app_settings (key, value) VALUES ('schema_posts_bilingual_nullable_v1', '1')",
      )
      .run()
  }

  // Item 45: Add ON DELETE CASCADE to post_tags.tag_id FK (was missing in initial migration)
  const ptCascadeMigrated = sqlite
    .prepare(
      "SELECT value FROM app_settings WHERE key = 'schema_post_tags_cascade_v1'",
    )
    .get() as { value: string } | undefined

  if (!ptCascadeMigrated) {
    sqlite.pragma('foreign_keys = OFF')
    sqlite.exec(`
      BEGIN;
      CREATE TABLE post_tags_new (
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );
      INSERT OR IGNORE INTO post_tags_new SELECT * FROM post_tags;
      DROP TABLE post_tags;
      ALTER TABLE post_tags_new RENAME TO post_tags;
      COMMIT;
    `)
    sqlite.pragma('foreign_keys = ON')
    sqlite
      .prepare(
        "INSERT INTO app_settings (key, value) VALUES ('schema_post_tags_cascade_v1', '1')",
      )
      .run()
  }

  // Indexes for hot filter/sort columns
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_status_published_at
      ON posts(status, published_at DESC);

    CREATE INDEX IF NOT EXISTS idx_resume_work_locale
      ON resume_work(locale);

    CREATE INDEX IF NOT EXISTS idx_resume_education_locale
      ON resume_education(locale);

    CREATE INDEX IF NOT EXISTS idx_resume_projects_locale
      ON resume_projects(locale);
  `)
}
