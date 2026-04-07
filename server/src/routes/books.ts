import { Hono } from 'hono'
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

async function googleBooksSearch(
  query: string,
  maxResults = 10,
): Promise<GBVolume[]> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books`,
  )
  if (!res.ok) return []
  const data = (await res.json()) as { items?: GBVolume[] }
  return data.items ?? []
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
    createdAt: row.createdAt,
  }
}

// public router

export const booksPublic = new Hono()

booksPublic.get('/', (c) => {
  const rows = db.select().from(books).orderBy(desc(books.createdAt)).all()
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
  const {
    title,
    author,
    status,
    coverUrl: providedCover,
    year: providedYear,
  } = await c.req.json<{
    title: string
    author: string
    status?: 'reading' | 'finished' | 'want'
    coverUrl?: string | null
    year?: number | null
  }>()

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

booksAdmin.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  db.delete(books).where(eq(books.id, id)).run()
  return c.json({ ok: true })
})
