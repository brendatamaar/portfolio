import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import { runMigrations } from './db/migrate.js'
import { initJwtSecret } from './lib/init.js'
import authRoutes from './routes/auth.js'
import postsRoutes from './routes/posts.js'
import adminRoutes from './routes/admin.js'
import { booksPublic, booksAdmin } from './routes/books.js'
import { albumsPublic, albumsAdmin } from './routes/albums.js'
import { authMiddleware } from './middleware/auth.js'
import { requestLogger } from './middleware/requestLogger.js'
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
      return allowed.includes(origin) ? origin : allowed[0]
    },
    credentials: true,
  }),
)

// Static uploads
app.use('/uploads/*', serveStatic({ root: './' }))

// Public routes
app.route('/api/auth', authRoutes)
app.route('/api/posts', postsRoutes)
app.route('/api/books', booksPublic)
app.route('/api/albums', albumsPublic)

// Protected admin routes
app.use('/api/admin/*', authMiddleware)
app.route('/api/admin', adminRoutes)
app.route('/api/admin/books', booksAdmin)
app.route('/api/admin/albums', albumsAdmin)

// Health check
app.get('/api/health', (c) => c.json({ ok: true }))

// Server

const PORT = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port: PORT }, () => {
  logger.info(`Server running on http://localhost:${PORT}`)
})
