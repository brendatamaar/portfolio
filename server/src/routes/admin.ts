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
  publishedAt: z.coerce.date().nullable().optional(),
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
  const publishedAt =
    data.publishedAt !== undefined
      ? data.publishedAt
      : data.status === 'published'
        ? now
        : null

  const inserted = db
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
    .returning({ id: posts.id })
    .get()

  if (data.tagIds?.length) {
    db.insert(postTags)
      .values(data.tagIds.map((tagId) => ({ postId: inserted.id, tagId })))
      .run()
  }

  const result = db.select().from(posts).where(eq(posts.id, inserted.id)).get()!
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

  // Use explicit publishedAt if provided, otherwise auto-set on first publish
  let publishedAt = existing.publishedAt
  if (data.publishedAt !== undefined) {
    publishedAt = data.publishedAt
  } else if (data.status === 'published' && !publishedAt) {
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

/**
 * Extract fenced code blocks and inline code from markdown text, replacing
 * them with numeric placeholders `[[0]]`, `[[1]]` etc. that LibreTranslate
 * will pass through untouched.  Call `restoreCode` with the returned slots
 * to put them back after translation.
 */
function extractCode(text: string): { text: string; slots: string[] } {
  const slots: string[] = []
  let out = text
  // Fenced code blocks (``` ... ```) — must come before inline to avoid
  // matching the opening fence as inline code
  out = out.replace(/```[\s\S]*?```/g, (m) => {
    slots.push(m)
    return `[[${slots.length - 1}]]`
  })
  // Inline code (`...`)
  out = out.replace(/`[^`\n]+`/g, (m) => {
    slots.push(m)
    return `[[${slots.length - 1}]]`
  })
  return { text: out, slots }
}

function restoreCode(text: string, slots: string[]): string {
  return text.replace(
    /\[\[(\d+)\]\]/g,
    (_, i) => slots[Number(i)] ?? `[[${i}]]`,
  )
}

const translateBatchSchema = z.object({
  texts: z.array(z.string()).min(1),
  source: z.enum(['en', 'id']),
  target: z.enum(['en', 'id']),
})

app.post('/translate', async (c) => {
  const libreUrl = process.env.LIBRETRANSLATE_URL
  if (!libreUrl)
    return c.json({ error: 'LIBRETRANSLATE_URL not configured' }, 503)

  const body = await c.req.json().catch(() => null)
  const parsed = translateBatchSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400)

  const { texts, source, target } = parsed.data

  // Protect code blocks and filter out empty strings before sending to LibreTranslate
  const protected_ = texts.map(extractCode)
  const nonEmpty = protected_
    .map((p, i) => ({ i, text: p.text }))
    .filter(({ text }) => text.trim().length > 0)

  // If everything is empty, return early with empty strings
  if (nonEmpty.length === 0) {
    return c.json({ translatedTexts: texts.map(() => '') })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  let res: Response
  try {
    res = await fetch(`${libreUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: nonEmpty.map(({ text }) => text),
        source,
        target,
        format: 'text',
      }),
      signal: controller.signal,
    })
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return c.json(
      {
        error: isAbort
          ? 'Translation timed out'
          : 'Failed to reach LibreTranslate',
      },
      502,
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    return c.json({ error: `LibreTranslate error: ${err}` }, 502)
  }

  const data = (await res.json()) as unknown
  if (
    typeof data !== 'object' ||
    data === null ||
    !Array.isArray((data as { translatedText?: unknown }).translatedText) ||
    (data as { translatedText: unknown[] }).translatedText.length !==
      nonEmpty.length
  ) {
    return c.json({ error: 'Unexpected response from LibreTranslate' }, 502)
  }

  const translated = (data as { translatedText: string[] }).translatedText

  // Re-map results back to original positions and restore code blocks
  const translatedTexts = texts.map((_, idx) => {
    const slot = nonEmpty.findIndex(({ i }) => i === idx)
    if (slot === -1) return ''
    return restoreCode(translated[slot], protected_[idx].slots)
  })

  return c.json({ translatedTexts })
})

export default app
