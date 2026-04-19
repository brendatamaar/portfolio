import type { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { getCookie } from 'hono/cookie'
import { db } from '../db/index.js'
import { appSettings } from '../db/schema.js'
import { eq } from 'drizzle-orm'

const jwtPayloadSchema = z.object({
  sub: z.string(),
})

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
  const token = getCookie(c, 'admin_token')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const secret = await getJwtSecret()
    const raw = jwt.verify(token, secret)
    const payload = jwtPayloadSchema.parse(raw)
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
