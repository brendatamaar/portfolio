import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { db } from '../db/index.js'
import { sessions, adminUsers } from '../db/schema.js'
import { eq, and, gt } from 'drizzle-orm'

/** Admin routes need a live row in `sessions` for the `session` cookie. */
export async function authMiddleware(c: Context, next: Next) {
  const sessionId = getCookie(c, 'session')
  const session = sessionId
    ? db
        .select({ userId: sessions.userId })
        .from(sessions)
        .where(
          and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())),
        )
        .get()
    : undefined
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  c.set('userId', String(session.userId))
  await next()
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
