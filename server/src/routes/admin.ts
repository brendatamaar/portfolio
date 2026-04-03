/**
 * Protected admin routes (all require Bearer JWT).
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/index.js'
import { posts, tags, postTags, images } from '../db/schema.js'
import { eq, desc, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '../../uploads')
mkdirSync(UPLOADS_DIR, { recursive: true })

const app = new Hono()

// ─── Helper ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// ─── Posts ────────────────────────────────────────────────────────────────────

const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().default(''),
  content: z.string().default(''),
  titleId: z.string().default(''),
  descriptionId: z.string().default(''),
  contentId: z.string().default(''),
  status: z.enum(['draft', 'published']).default('draft'),
  coverImageUrl: z.string().nullable().optional(),
  tagIds: z.array(z.number()).optional(),
})

app.get('/posts', (c) => {
  const rows = db.select().from(posts).orderBy(desc(posts.updatedAt)).all()

  const result = rows.map((post) => {
    const postTagRows = db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id))
      .all()
    return { ...post, tags: postTagRows }
  })

  return c.json(result)
})

app.post('/posts', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400)

  const data = parsed.data
  const slug = data.slug ?? slugify(data.title)

  const now = new Date()
  const publishedAt = data.status === 'published' ? now : null

  const result = db
    .insert(posts)
    .values({
      title: data.title,
      slug,
      description: data.description,
      content: data.content,
      titleId: data.titleId,
      descriptionId: data.descriptionId,
      contentId: data.contentId,
      status: data.status,
      coverImageUrl: data.coverImageUrl ?? null,
      publishedAt,
      updatedAt: now,
    })
    .returning()
    .get()

  if (data.tagIds?.length) {
    db.insert(postTags)
      .values(data.tagIds.map((tagId) => ({ postId: result.id, tagId })))
      .run()
  }

  return c.json(result, 201)
})

app.put('/posts/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json().catch(() => null)
  const parsed = postSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400)

  const existing = db.select().from(posts).where(eq(posts.id, id)).get()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const data = parsed.data
  const now = new Date()

  // Set publishedAt only when transitioning to published for the first time
  let publishedAt = existing.publishedAt
  if (data.status === 'published' && !publishedAt) {
    publishedAt = now
  }

  const updated = db
    .update(posts)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.titleId !== undefined && { titleId: data.titleId }),
      ...(data.descriptionId !== undefined && {
        descriptionId: data.descriptionId,
      }),
      ...(data.contentId !== undefined && { contentId: data.contentId }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.coverImageUrl !== undefined && {
        coverImageUrl: data.coverImageUrl,
      }),
      publishedAt,
      updatedAt: now,
    })
    .where(eq(posts.id, id))
    .returning()
    .get()

  if (data.tagIds !== undefined) {
    db.delete(postTags).where(eq(postTags.postId, id)).run()
    if (data.tagIds.length) {
      db.insert(postTags)
        .values(data.tagIds.map((tagId) => ({ postId: id, tagId })))
        .run()
    }
  }

  return c.json(updated)
})

app.delete('/posts/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db.select().from(posts).where(eq(posts.id, id)).get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(posts).where(eq(posts.id, id)).run()
  return c.json({ ok: true })
})

// ─── Images ───────────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

app.get('/images', (c) => {
  const rows = db.select().from(images).orderBy(desc(images.createdAt)).all()
  return c.json(rows)
})

app.post('/upload', async (c) => {
  const formData = await c.req.formData().catch(() => null)
  if (!formData) return c.json({ error: 'Invalid form data' }, 400)

  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (!ALLOWED_MIME.has(file.type))
    return c.json({ error: 'File type not allowed' }, 400)
  if (file.size > MAX_SIZE)
    return c.json({ error: 'File too large (max 10 MB)' }, 400)

  const ext = extname(file.name) || '.bin'
  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`
  const filepath = join(UPLOADS_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  writeFileSync(filepath, buffer)

  const url = `/uploads/${filename}`

  const row = db
    .insert(images)
    .values({
      filename,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      url,
    })
    .returning()
    .get()

  return c.json({ id: row.id, url, filename }, 201)
})

app.delete('/images/:id', (c) => {
  const id = Number(c.req.param('id'))
  const row = db.select().from(images).where(eq(images.id, id)).get()
  if (!row) return c.json({ error: 'Not found' }, 404)

  const filepath = join(UPLOADS_DIR, row.filename)
  if (existsSync(filepath)) unlinkSync(filepath)

  db.delete(images).where(eq(images.id, id)).run()
  return c.json({ ok: true })
})

// ─── Tags ─────────────────────────────────────────────────────────────────────

const tagSchema = z.object({ name: z.string().min(1) })

app.get('/tags', (c) => {
  return c.json(db.select().from(tags).all())
})

app.post('/tags', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = tagSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)

  const slug = slugify(parsed.data.name)
  const row = db
    .insert(tags)
    .values({ name: parsed.data.name, slug })
    .returning()
    .get()
  return c.json(row, 201)
})

app.delete('/tags/:id', (c) => {
  const id = Number(c.req.param('id'))
  db.delete(tags).where(eq(tags.id, id)).run()
  return c.json({ ok: true })
})

// ─── Translate ────────────────────────────────────────────────────────────────

const translateSchema = z.object({
  text: z.string(),
  source: z.enum(['en', 'id']),
  target: z.enum(['en', 'id']),
})

app.post('/translate', async (c) => {
  const libreUrl = process.env.LIBRETRANSLATE_URL
  if (!libreUrl)
    return c.json({ error: 'LIBRETRANSLATE_URL not configured' }, 503)

  const body = await c.req.json().catch(() => null)
  const parsed = translateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400)

  const { text, source, target } = parsed.data

  const res = await fetch(`${libreUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target, format: 'text' }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    return c.json({ error: `LibreTranslate error: ${err}` }, 502)
  }

  const data = (await res.json()) as { translatedText: string }
  return c.json({ translatedText: data.translatedText })
})

export default app
