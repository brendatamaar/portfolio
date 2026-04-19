import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/index.js'
import { books } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

// helpers

type GBVolume = {
  volumeInfo?: {
    title?: string
    authors?: string[]
    publishedDate?: string
    industryIdentifiers?: { type: string; identifier: string }[]
    imageLinks?: { thumbnail?: string }
  }
}

function isbnFrom(q: string): string | null {
  const raw = q.replace(/[-\s]/g, '')
  return /^\d{10}$/.test(raw) || /^\d{13}$/.test(raw) ? raw : null
}

function yearFromDate(dateStr?: string): number | null {
  if (!dateStr) return null
  const y = parseInt(dateStr.substring(0, 4), 10)
  return isNaN(y) ? null : y
}

/** Build cover URL from ISBN identifiers, fall back to thumbnail. zoom=2 for higher quality. */
function coverFromVolume(vol: GBVolume['volumeInfo']): string | null {
  const ids = vol?.industryIdentifiers ?? []
  const isbn13 = ids.find((x) => x.type === 'ISBN_13')?.identifier
  const isbn10 = ids.find((x) => x.type === 'ISBN_10')?.identifier
  const isbn = isbn13 ?? isbn10
  if (isbn) {
    return `https://books.google.com/books/content?vid=ISBN${isbn}&printsec=frontcover&img=1&zoom=2`
  }
  return vol?.imageLinks?.thumbnail ?? null
}

// In-memory TTL cache for Google Books search results
type CacheEntry<T> = { value: T; expiresAt: number }
const searchCache = new Map<string, CacheEntry<GBVolume[]>>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function getCached(key: string): GBVolume[] | undefined {
  const entry = searchCache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key)
    return undefined
  }
  return entry.value
}

function setCached(key: string, value: GBVolume[]) {
  searchCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL })
}

async function googleBooksSearch(
  query: string,
  maxResults = 10,
): Promise<GBVolume[]> {
  const cacheKey = `${query}:${maxResults}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books`,
      { signal: controller.signal },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { items?: GBVolume[] }
    const items = data.items ?? []
    setCached(cacheKey, items)
    return items
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchBookMeta(
  title: string,
  author: string,
): Promise<{ coverUrl: string | null; year: number | null }> {
  try {
    const isbn = isbnFrom(title)
    const query = isbn ? `isbn:${isbn}` : `intitle:${title}+inauthor:${author}`
    const items = await googleBooksSearch(query, 1)
    const vol = items[0]?.volumeInfo
    return {
      coverUrl: coverFromVolume(vol),
      year: yearFromDate(vol?.publishedDate),
    }
  } catch {
    return { coverUrl: null, year: null }
  }
}

function toResponse(row: typeof books.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    status: row.status,
    year: row.year,
    coverUrl: row.coverUrl,
    featured: row.featured === 1,
    createdAt: row.createdAt,
  }
}

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  status: z.enum(['reading', 'finished', 'want']).optional(),
  coverUrl: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
})

// public router

export const booksPublic = new Hono()

booksPublic.get('/', (c) => {
  const featured = c.req.query('featured')
  let query = db.select().from(books)
  if (featured === 'true') {
    query = query.where(eq(books.featured, 1)) as typeof query
  }
  const rows = query.orderBy(desc(books.createdAt)).all()
  return c.json(rows.map(toResponse))
})

// admin router

export const booksAdmin = new Hono()

booksAdmin.get('/', (c) => {
  const rows = db.select().from(books).orderBy(desc(books.createdAt)).all()
  return c.json(rows.map(toResponse))
})

booksAdmin.get('/search', async (c) => {
  const q = c.req.query('q')?.trim()
  if (!q || q.length < 2) return c.json([])
  try {
    const isbn = isbnFrom(q)
    const query = isbn ? `isbn:${isbn}` : `intitle:${q}`
    const items = await googleBooksSearch(query, isbn ? 1 : 10)
    const results = items
      .filter((item) => item.volumeInfo?.title)
      .map((item) => ({
        title: item.volumeInfo!.title!,
        author: item.volumeInfo?.authors?.[0] ?? '',
        year: yearFromDate(item.volumeInfo?.publishedDate),
        coverUrl: coverFromVolume(item.volumeInfo),
      }))
    return c.json(results)
  } catch {
    return c.json([])
  }
})

booksAdmin.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (body === null) return c.json({ error: 'Malformed JSON' }, 400)
  const parsed = bookSchema.safeParse(body)
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
    author,
    status,
    coverUrl: providedCover,
    year: providedYear,
  } = parsed.data

  const needsFetch = providedCover === undefined || providedYear === undefined
  const meta = needsFetch
    ? await fetchBookMeta(title, author)
    : { coverUrl: null, year: null }

  const coverUrl =
    providedCover !== undefined ? (providedCover ?? null) : meta.coverUrl
  const year = providedYear !== undefined ? (providedYear ?? null) : meta.year

  const result = db
    .insert(books)
    .values({ title, author, status: status ?? 'finished', coverUrl, year })
    .returning()
    .get()
  return c.json(toResponse(result), 201)
})

booksAdmin.patch('/:id/feature', (c) => {
  const id = Number(c.req.param('id'))
  db.update(books).set({ featured: 0 }).run()
  const result = db
    .update(books)
    .set({ featured: 1 })
    .where(eq(books.id, id))
    .returning()
    .get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(toResponse(result))
})

booksAdmin.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db.select().from(books).where(eq(books.id, id)).get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(books).where(eq(books.id, id)).run()
  return c.json({ ok: true })
})
