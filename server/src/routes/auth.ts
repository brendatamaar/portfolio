import { Hono } from 'hono'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { db } from '../db/index.js'
import { adminUsers, sessions } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { getJwtSecret, getSessionUser } from '../middleware/auth.js'
import { verifyPassword } from '../lib/crypto.js'

const app = new Hono()

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

app.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)

  const { username, password } = parsed.data

  const user = db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .get()
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

  const isProduction = process.env.NODE_ENV === 'production'
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax' as const,
    path: '/',
    ...(isProduction && { domain: '.brendatama.dev' }),
  }

  // New: session-based cookie
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  db.insert(sessions)
    .values({
      id: sessionId,
      userId: user.id,
      expiresAt,
      userAgent: c.req.header('user-agent') ?? null,
      ip: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? null,
    })
    .run()
  setCookie(c, 'session', sessionId, {
    ...cookieOpts,
    maxAge: SESSION_TTL_MS / 1000,
  })

  // Legacy: JWT cookie (kept for backward compat during migration)
  const secret = await getJwtSecret()
  const token = jwt.sign({ sub: String(user.id) }, secret, { expiresIn: '30d' })
  setCookie(c, 'admin_token', token, {
    ...cookieOpts,
    maxAge: 60 * 60 * 24 * 30,
  })

  return c.json({ ok: true })
})

app.post('/logout', (c) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieOpts = {
    path: '/',
    ...(isProduction && { domain: '.brendatama.dev' }),
  }

  // Delete session from DB
  const sessionId = getCookie(c, 'session')
  if (sessionId) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run()
  }

  deleteCookie(c, 'session', cookieOpts)
  deleteCookie(c, 'admin_token', cookieOpts)
  return c.json({ ok: true })
})

app.get('/me', async (c) => {
  const sessionId = getCookie(c, 'session')
  if (sessionId) {
    const user = await getSessionUser(sessionId)
    if (user) return c.json({ id: user.id, username: user.username })
  }
  return c.json({ error: 'Unauthorized' }, 401)
})

export default app
