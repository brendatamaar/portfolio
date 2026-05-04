/**
 * Protected admin routes (all require httpOnly cookie JWT).
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/index.js'
import { posts, tags, postTags, images } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { writeFile, unlink, existsSync, mkdirSync } from 'fs'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { buildPostDetail } from '../lib/postDetail.js'

const writeFileAsync = promisify(writeFile)
const unlinkAsync = promisify(unlink)

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '../../uploads')
mkdirSync(UPLOADS_DIR, { recursive: true })

const app = new Hono()

// Me endpoint — lets the admin UI verify cookie auth is valid
app.get('/me', (c) => {
  return c.json({ ok: true })
})

// Helper

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Posts

const glossaryEntrySchema = z.object({
  key: z.string().min(1),
  term: z.string().min(1),
  definition: z.string().min(1),
})

const bibliographyEntrySchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
  sourceType: z.enum([
    'web',
    'docs',
    'journal',
    'article',
    'book',
    'video',
    'podcast',
    'repo',
    'other',
  ]),
})

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
  glossaryEn: z.array(glossaryEntrySchema).default([]),
  glossaryId: z.array(glossaryEntrySchema).nullable().optional(),
  bibliographyEn: z.array(bibliographyEntrySchema).default([]),
  bibliographyId: z.array(bibliographyEntrySchema).nullable().optional(),
})

app.get('/posts', (c) => {
  // Single LEFT JOIN — eliminates N+1 tag fetches
  const rows = db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      description: posts.description,
      content: posts.content,
      titleId: posts.titleId,
      descriptionId: posts.descriptionId,
      contentId: posts.contentId,
      status: posts.status,
      coverImageUrl: posts.coverImageUrl,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      tagId: tags.id,
      tagName: tags.name,
      tagSlug: tags.slug,
    })
    .from(posts)
    .leftJoin(postTags, eq(postTags.postId, posts.id))
    .leftJoin(tags, eq(tags.id, postTags.tagId))
    .orderBy(desc(posts.updatedAt))
    .all()

  const postMap = new Map<
    number,
    Record<string, unknown> & {
      tags: { id: number; name: string; slug: string }[]
    }
  >()
  for (const row of rows) {
    if (!postMap.has(row.id)) {
      postMap.set(row.id, {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        content: row.content,
        titleId: row.titleId,
        descriptionId: row.descriptionId,
        contentId: row.contentId,
        status: row.status,
        coverImageUrl: row.coverImageUrl,
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        tags: [],
      })
    }
    if (row.tagId && row.tagName && row.tagSlug) {
      postMap
        .get(row.id)!
        .tags.push({ id: row.tagId, name: row.tagName, slug: row.tagSlug })
    }
  }

  return c.json(Array.from(postMap.values()))
})

app.get('/posts/:id', (c) => {
  const id = Number(c.req.param('id'))
  const post = db.select().from(posts).where(eq(posts.id, id)).get()
  if (!post) return c.json({ error: 'Not found' }, 404)
  const postTagRows = db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, id))
    .all()
  return c.json({
    ...post,
    tags: postTagRows,
    glossaryEn: JSON.parse(post.glossaryEn || '[]'),
    glossaryId: post.glossaryId ? JSON.parse(post.glossaryId) : null,
    bibliographyEn: JSON.parse(post.bibliographyEn || '[]'),
    bibliographyId: post.bibliographyId
      ? JSON.parse(post.bibliographyId)
      : null,
  })
})

app.get('/posts/:id/preview', (c) => {
  const id = Number(c.req.param('id'))
  const lang = c.req.query('lang')
  const post = db.select().from(posts).where(eq(posts.id, id)).get()
  if (!post) return c.json({ error: 'Not found' }, 404)

  return c.json(buildPostDetail(post, lang))
})

app.post('/posts', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (body === null) return c.json({ error: 'Malformed JSON' }, 400)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success)
    return c.json(
      {
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      422,
    )

  const data = parsed.data
  const slug = data.slug ?? slugify(data.title)

  const now = new Date()
  const publishedAt =
    data.publishedAt !== undefined
      ? data.publishedAt
      : data.status === 'published'
        ? now
        : null

  const result = db.transaction((tx) => {
    const inserted = tx
      .insert(posts)
      .values({
        title: data.title,
        slug,
        description: data.description,
        content: data.content,
        titleId: data.titleId || null,
        descriptionId: data.descriptionId || null,
        contentId: data.contentId || null,
        status: data.status,
        coverImageUrl: data.coverImageUrl ?? null,
        publishedAt,
        updatedAt: now,
        glossaryEn: JSON.stringify(data.glossaryEn),
        glossaryId: data.glossaryId ? JSON.stringify(data.glossaryId) : null,
        bibliographyEn: JSON.stringify(data.bibliographyEn),
        bibliographyId: data.bibliographyId
          ? JSON.stringify(data.bibliographyId)
          : null,
      })
      .returning({ id: posts.id })
      .get()

    if (data.tagIds?.length) {
      tx.insert(postTags)
        .values(data.tagIds.map((tagId) => ({ postId: inserted.id, tagId })))
        .run()
    }

    return tx.select().from(posts).where(eq(posts.id, inserted.id)).get()!
  })

  return c.json(result, 201)
})

app.put('/posts/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json().catch(() => null)
  if (body === null) return c.json({ error: 'Malformed JSON' }, 400)
  const parsed = postSchema.partial().safeParse(body)
  if (!parsed.success)
    return c.json(
      {
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      422,
    )

  const existing = db.select().from(posts).where(eq(posts.id, id)).get()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const data = parsed.data
  const now = new Date()

  let publishedAt = existing.publishedAt
  if (data.publishedAt !== undefined) {
    publishedAt = data.publishedAt
  } else if (data.status === 'published' && !publishedAt) {
    publishedAt = now
  }

  const updated = db.transaction((tx) => {
    tx.update(posts)
      .set({
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.titleId !== undefined && { titleId: data.titleId || null }),
        ...(data.descriptionId !== undefined && {
          descriptionId: data.descriptionId || null,
        }),
        ...(data.contentId !== undefined && {
          contentId: data.contentId || null,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.coverImageUrl !== undefined && {
          coverImageUrl: data.coverImageUrl,
        }),
        ...(data.glossaryEn !== undefined && {
          glossaryEn: JSON.stringify(data.glossaryEn),
        }),
        ...(data.glossaryId !== undefined && {
          glossaryId: data.glossaryId ? JSON.stringify(data.glossaryId) : null,
        }),
        ...(data.bibliographyEn !== undefined && {
          bibliographyEn: JSON.stringify(data.bibliographyEn),
        }),
        ...(data.bibliographyId !== undefined && {
          bibliographyId: data.bibliographyId
            ? JSON.stringify(data.bibliographyId)
            : null,
        }),
        publishedAt,
        updatedAt: now,
      })
      .where(eq(posts.id, id))
      .run()

    if (data.tagIds !== undefined) {
      tx.delete(postTags).where(eq(postTags.postId, id)).run()
      if (data.tagIds.length) {
        tx.insert(postTags)
          .values(data.tagIds.map((tagId) => ({ postId: id, tagId })))
          .run()
      }
    }

    return tx.select().from(posts).where(eq(posts.id, id)).get()!
  })

  return c.json(updated)
})

app.delete('/posts/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db.select().from(posts).where(eq(posts.id, id)).get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(posts).where(eq(posts.id, id)).run()
  return c.json({ ok: true })
})

// Images

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
}

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function detectMimeType(buf: Buffer): string | null {
  if (buf.length < 12) return null
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return 'image/png'
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return 'image/gif'
  // WebP: RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return 'image/webp'
  return null
}

app.get('/images', (c) => {
  const rows = db.select().from(images).orderBy(desc(images.createdAt)).all()
  return c.json(rows)
})

app.post('/upload', async (c) => {
  const formData = await c.req.formData().catch(() => null)
  if (!formData) return c.json({ error: 'Invalid form data' }, 400)

  const file = formData.get('file') as File | null
  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (file.size > MAX_SIZE)
    return c.json({ error: 'File too large (max 10 MB)' }, 400)

  const buffer = Buffer.from(await file.arrayBuffer())

  // Validate actual file content via magic bytes — ignore client-supplied MIME/extension
  const detectedMime = detectMimeType(buffer)
  if (!detectedMime || !ALLOWED_MIME.has(detectedMime)) {
    return c.json({ error: 'File type not allowed' }, 400)
  }

  const ext = EXT_MAP[detectedMime]
  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`
  const filepath = join(UPLOADS_DIR, filename)

  await writeFileAsync(filepath, buffer)

  const url = `/uploads/${filename}`

  const row = db
    .insert(images)
    .values({
      filename,
      originalName: file.name,
      mimeType: detectedMime,
      sizeBytes: file.size,
      url,
    })
    .returning()
    .get()

  return c.json({ id: row.id, url, filename }, 201)
})

app.delete('/images/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const row = db.select().from(images).where(eq(images.id, id)).get()
  if (!row) return c.json({ error: 'Not found' }, 404)

  const filepath = join(UPLOADS_DIR, row.filename)
  if (existsSync(filepath)) await unlinkAsync(filepath)

  db.delete(images).where(eq(images.id, id)).run()
  return c.json({ ok: true })
})

// Tags

const tagSchema = z.object({ name: z.string().min(1) })

app.get('/tags', (c) => {
  return c.json(db.select().from(tags).all())
})

app.post('/tags', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (body === null) return c.json({ error: 'Malformed JSON' }, 400)
  const parsed = tagSchema.safeParse(body)
  if (!parsed.success)
    return c.json(
      {
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      422,
    )

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
  const existing = db.select().from(tags).where(eq(tags.id, id)).get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(tags).where(eq(tags.id, id)).run()
  return c.json({ ok: true })
})

// Translate

function extractCode(text: string): { text: string; slots: string[] } {
  const slots: string[] = []
  let out = text
  out = out.replace(/```[\s\S]*?```/g, (m) => {
    slots.push(m)
    return `[[${slots.length - 1}]]`
  })
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
  if (body === null) return c.json({ error: 'Malformed JSON' }, 400)
  const parsed = translateBatchSchema.safeParse(body)
  if (!parsed.success)
    return c.json(
      {
        error: 'Validation failed',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      422,
    )

  const { texts, source, target } = parsed.data

  const protected_ = texts.map(extractCode)
  const nonEmpty = protected_
    .map((p, i) => ({ i, text: p.text }))
    .filter(({ text }) => text.trim().length > 0)

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

  const translatedTexts = texts.map((_, idx) => {
    const slot = nonEmpty.findIndex(({ i }) => i === idx)
    if (slot === -1) return ''
    return restoreCode(translated[slot], protected_[idx].slots)
  })

  return c.json({ translatedTexts })
})

export default app
