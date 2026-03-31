/**
 * One-time admin setup script.
 * Run with: npm run setup (from server/ directory)
 *
 * Creates the admin user in the database.
 * Never stores plaintext password — only a scrypt hash.
 */

import { createInterface } from 'readline';
import { db } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { initJwtSecret } from '../src/lib/init.js';
import { adminUsers } from '../src/db/schema.js';
import { hashPassword } from '../src/lib/crypto.js';
import { eq } from 'drizzle-orm';

runMigrations();
await initJwtSecret();

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

const username = (await ask('Admin username: ')).trim();
if (!username) { console.error('Username cannot be empty.'); process.exit(1); }

const password = (await ask('Admin password: ')).trim();
if (password.length < 8) { console.error('Password must be at least 8 characters.'); process.exit(1); }

rl.close();

const existing = db.select().from(adminUsers).where(eq(adminUsers.username, username)).get();
if (existing) {
  console.log(`User "${username}" already exists. Updating password...`);
  const hash = await hashPassword(password);
  db.update(adminUsers).set({ passwordHash: hash }).where(eq(adminUsers.username, username)).run();
  console.log('Password updated.');
} else {
  const hash = await hashPassword(password);
  db.insert(adminUsers).values({ username, passwordHash: hash }).run();
  console.log(`Admin user "${username}" created successfully.`);
}

process.exit(0);
