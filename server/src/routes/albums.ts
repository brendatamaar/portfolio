import { Hono } from 'hono'
import { db } from '../db/index.js'
import { albums } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

// helpers

type ItunesResult = {
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
  releaseDate?: string
}

function yearFromIso(dateStr?: string): number | null {
  if (!dateStr) return null
  const y = new Date(dateStr).getFullYear()
  return isNaN(y) ? null : y
}

async function fetchAlbumMeta(
  title: string,
  artist: string,
): Promise<{ coverUrl: string | null; year: number | null }> {
  try {
    const q = encodeURIComponent(`${artist} ${title}`)
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=album&limit=1`,
    )
    if (!res.ok) return { coverUrl: null, year: null }
    const data = (await res.json()) as { results?: ItunesResult[] }
    const r = data.results?.[0]
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
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=10`,
    )
    if (!res.ok) return c.json([])
    const data = (await res.json()) as { results?: ItunesResult[] }
    const results = (data.results ?? []).map((r) => ({
      title: r.collectionName ?? '',
      artist: r.artistName ?? '',
      year: yearFromIso(r.releaseDate),
      coverUrl: r.artworkUrl100
        ? r.artworkUrl100.replace('100x100bb.jpg', '300x300bb.jpg')
        : null,
    }))
    return c.json(results)
  } catch {
    return c.json([])
  }
})

albumsAdmin.post('/', async (c) => {
  const {
    title,
    artist,
    coverUrl: providedCover,
    year: providedYear,
  } = await c.req.json<{
    title: string
    artist: string
    coverUrl?: string | null
    year?: number | null
  }>()

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
  db.delete(albums).where(eq(albums.id, id)).run()
  return c.json({ ok: true })
})
