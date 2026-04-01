import type { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { db } from '../db/index.js'
import { appSettings } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export async function getJwtSecret(): Promise<string> {
  const row = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, 'jwt_secret'))
    .get()
  if (!row)
    throw new Error('JWT secret not initialised. Run the setup script first.')
  return row.value
}

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = header.slice(7)
  try {
    const secret = await getJwtSecret()
    const payload = jwt.verify(token, secret) as { sub: string }
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
