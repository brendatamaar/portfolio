import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import { runMigrations } from './db/migrate.js'
import { initJwtSecret } from './lib/init.js'
import { db } from './db/index.js'
import { sql } from 'drizzle-orm'
import authRoutes from './routes/auth.js'
import postsRoutes from './routes/posts.js'
import adminRoutes from './routes/admin.js'
import { booksPublic, booksAdmin } from './routes/books.js'
import { albumsPublic, albumsAdmin } from './routes/albums.js'
import { resumePublic, resumeAdmin } from './routes/resume.js'
import { authMiddleware } from './middleware/auth.js'
import { requestLogger } from './middleware/requestLogger.js'
import { createRateLimit } from './middleware/rateLimit.js'
import { logger } from './lib/logger.js'

// Bootstrap

runMigrations()
await initJwtSecret()

// App

const app = new Hono()

app.use('*', requestLogger)

app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow localhost in dev; lock down in production via env
      const allowed = process.env.CORS_ORIGINS?.split(',') ?? [
        'http://localhost:5173',
        'http://localhost:5174',
      ]
      return allowed.includes(origin) ? origin : null
    },
    credentials: true,
  }),
)

// Static uploads
app.use('/uploads/*', serveStatic({ root: './' }))

// Rate limiters
const loginLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 })
const uploadLimiter = createRateLimit({ windowMs: 60 * 1000, max: 20 })

// Public routes
app.use('/api/auth/login', loginLimiter)
app.route('/api/auth', authRoutes)
app.route('/api/posts', postsRoutes)
app.route('/api/books', booksPublic)
app.route('/api/albums', albumsPublic)
app.route('/api/resume', resumePublic)

// Protected admin routes
app.use('/api/admin/upload', uploadLimiter)
app.use('/api/admin/*', authMiddleware)
app.route('/api/admin', adminRoutes)
app.route('/api/admin/books', booksAdmin)
app.route('/api/admin/albums', albumsAdmin)
app.route('/api/admin/resume', resumeAdmin)

// Health check
app.get('/api/health', (c) => {
  try {
    db.run(sql`SELECT 1`)
    return c.json({ ok: true })
  } catch {
    return c.json({ ok: false, error: 'Database unavailable' }, 503)
  }
})

// Global error handler
app.onError((err, c) => {
  logger.error(`${c.req.method} ${c.req.path} — ${err.message}`)
  return c.json({ error: 'Internal server error' }, 500)
})

// Server

const PORT = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port: PORT }, () => {
  logger.info(`Server running on http://localhost:${PORT}`)
})
