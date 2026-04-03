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
      tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
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
  `)

  // Add i18n columns to existing posts table (SQLite has no IF NOT EXISTS for ALTER TABLE)
  for (const col of [
    "title_id TEXT NOT NULL DEFAULT ''",
    "description_id TEXT NOT NULL DEFAULT ''",
    "content_id TEXT NOT NULL DEFAULT ''",
  ]) {
    try {
      sqlite.exec(`ALTER TABLE posts ADD COLUMN ${col}`)
    } catch {
      // Column already exists — safe to ignore
    }
  }
}
