import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Database } from 'bun:sqlite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const DB_PATH = join(DATA_DIR, 'app.db')
const BACKUP_DIR = join(DATA_DIR, 'backups')
const KEEP_LAST = 7

mkdirSync(BACKUP_DIR, { recursive: true })

const db = new Database(DB_PATH, { readonly: false })
db.run('PRAGMA wal_checkpoint(TRUNCATE)')
db.close()

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const dest = join(BACKUP_DIR, `app-${timestamp}.db`)

copyFileSync(DB_PATH, dest)
console.log(`Backed up to ${dest}`)

const backups = readdirSync(BACKUP_DIR)
  .filter((f) => f.endsWith('.db'))
  .map((f) => ({ name: f, mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)

for (const old of backups.slice(KEEP_LAST)) {
  rmSync(join(BACKUP_DIR, old.name))
  console.log(`Removed old backup: ${old.name}`)
}

console.log(`Done. ${Math.min(backups.length, KEEP_LAST)} backup(s) retained.`)
