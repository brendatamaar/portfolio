import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/index.js'
import { albums } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'
import type { ItunesResult } from '../types/external.js'
import type { CacheEntry } from '../types/cache.js'

// helpers

function yearFromIso(dateStr?: string): number | null {
  if (!dateStr) return null
  const y = new Date(dateStr).getFullYear()
  return isNaN(y) ? null : y
}

// In-memory TTL cache for iTunes search results
const searchCache = new Map<string, CacheEntry<ItunesResult[]>>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function getCached(key: string): ItunesResult[] | undefined {
  const entry = searchCache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key)
    return undefined
  }
  return entry.value
}

function setCached(key: string, value: ItunesResult[]) {
  searchCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL })
}

async function itunesSearch(q: string, limit = 10): Promise<ItunesResult[]> {
  const cacheKey = `${q}:${limit}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=${limit}`,
      { signal: controller.signal },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { results?: ItunesResult[] }
    const results = data.results ?? []
    setCached(cacheKey, results)
    return results
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchAlbumMeta(
  title: string,
  artist: string,
): Promise<{ coverUrl: string | null; year: number | null }> {
  try {
    const results = await itunesSearch(`${artist} ${title}`, 1)
    const r = results[0]
    if (!r) return { coverUrl: null, year: null }
    return {
      coverUrl: r.artworkUrl100
        ? r.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
        : null,
      year: yearFromIso(r.releaseDate),
    }
  } catch {
    return { coverUrl: null, year: null }
  }
}

function toResponse(row: typeof albums.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    year: row.year,
    coverUrl: row.coverUrl,
    featured: row.featured === 1,
    createdAt: row.createdAt,
  }
}

const albumSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  coverUrl: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
})

// public router

export const albumsPublic = new Hono()

albumsPublic.get('/', (c) => {
  const featured = c.req.query('featured')
  let query = db.select().from(albums)
  if (featured === 'true') {
    query = query.where(eq(albums.featured, 1)) as typeof query
  }
  const rows = query.orderBy(desc(albums.createdAt)).all()
  return c.json(rows.map(toResponse))
})

// admin router

export const albumsAdmin = new Hono()

albumsAdmin.get('/', (c) => {
  const rows = db.select().from(albums).orderBy(desc(albums.createdAt)).all()
  return c.json(rows.map(toResponse))
})

albumsAdmin.get('/search', async (c) => {
  const q = c.req.query('q')?.trim()
  if (!q || q.length < 2) return c.json([])
  try {
    const results = await itunesSearch(q, 10)
    return c.json(
      results.map((r) => ({
        title: r.collectionName ?? '',
        artist: r.artistName ?? '',
        year: yearFromIso(r.releaseDate),
        coverUrl: r.artworkUrl100
          ? r.artworkUrl100.replace('100x100bb.jpg', '300x300bb.jpg')
          : null,
      })),
    )
  } catch {
    return c.json([])
  }
})

albumsAdmin.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (body === null) return c.json({ error: 'Malformed JSON' }, 400)
  const parsed = albumSchema.safeParse(body)
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

  const {
    title,
    artist,
    coverUrl: providedCover,
    year: providedYear,
  } = parsed.data

  const needsFetch = providedCover === undefined || providedYear === undefined
  const meta = needsFetch
    ? await fetchAlbumMeta(title, artist)
    : { coverUrl: null, year: null }

  const coverUrl =
    providedCover !== undefined ? (providedCover ?? null) : meta.coverUrl
  const year = providedYear !== undefined ? (providedYear ?? null) : meta.year

  const result = db
    .insert(albums)
    .values({ title, artist, coverUrl, year })
    .returning()
    .get()
  return c.json(toResponse(result), 201)
})

albumsAdmin.patch('/:id/feature', (c) => {
  const id = Number(c.req.param('id'))
  db.update(albums).set({ featured: 0 }).run()
  const result = db
    .update(albums)
    .set({ featured: 1 })
    .where(eq(albums.id, id))
    .returning()
    .get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(toResponse(result))
})

albumsAdmin.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db.select().from(albums).where(eq(albums.id, id)).get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(albums).where(eq(albums.id, id)).run()
  return c.json({ ok: true })
})
