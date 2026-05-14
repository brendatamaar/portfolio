import type { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { getCookie } from 'hono/cookie'
import { db } from '../db/index.js'
import { appSettings, sessions, adminUsers } from '../db/schema.js'
import { eq, and, gt } from 'drizzle-orm'

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
  // Check session cookie first (new cookie-session auth)
  const sessionId = getCookie(c, 'session')
  if (sessionId) {
    const now = new Date()
    const session = db
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
      .get()
    if (session) {
      c.set('userId', String(session.userId))
      await next()
      return
    }
  }

  // Fall back to legacy JWT cookie
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

export async function getSessionUser(
  sessionId: string,
): Promise<{ id: number; username: string } | null> {
  const now = new Date()
  const row = db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .get()
  if (!row) return null
  const user = db
    .select({ id: adminUsers.id, username: adminUsers.username })
    .from(adminUsers)
    .where(eq(adminUsers.id, row.userId))
    .get()
  return user ?? null
}
