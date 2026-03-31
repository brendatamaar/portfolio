/**
 * On first server start, auto-generate a JWT secret and store in DB.
 */

import { randomBytes } from 'crypto';
import { db } from '../db/index.js';
import { appSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function initJwtSecret(): Promise<void> {
  const existing = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, 'jwt_secret'))
    .get();

  if (!existing) {
    const secret = randomBytes(64).toString('hex');
    db.insert(appSettings).values({ key: 'jwt_secret', value: secret }).run();
    console.log('JWT secret generated and stored in database.');
  }
}
