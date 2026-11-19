import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/index.js'
import { labs } from '../db/schema.js'
import { eq, asc } from 'drizzle-orm'

const LABS_BASE_URL = (
  process.env.LABS_BASE_URL ?? 'https://labs.brendatama.dev'
).replace(/\/$/, '')

type LabRow = typeof labs.$inferSelect

function toResponse(row: LabRow) {
  let tags: string[] = []
  try {
    tags = JSON.parse(row.tags) as string[]
  } catch {
    // corrupt JSON: treat as no tags
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    url: row.url,
    demoUrl: row.demoUrl,
    /** demoUrl, or the default labs address when the admin left it empty */
    resolvedDemoUrl: row.demoUrl || `${LABS_BASE_URL}/${row.slug}/`,
    coverUrl: row.coverUrl,
    tags,
    status: row.status,
    sortOrder: row.sortOrder,
    published: row.published === 1,
  }
}

const labSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase letters, digits and dashes'),
  title: z.string().min(1),
  summary: z.string().default(''),
  url: z.string().default(''),
  demoUrl: z.string().default(''),
  coverUrl: z.string().nullable().optional(),
  tags: z.array(z.string().min(1)).default([]),
  status: z.enum(['live', 'wip', 'archived']).default('live'),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(false),
})

function values(d: z.infer<typeof labSchema>) {
  return {
    slug: d.slug,
    title: d.title.trim(),
    summary: d.summary.trim(),
    url: d.url.trim(),
    demoUrl: d.demoUrl.trim(),
    coverUrl: d.coverUrl ?? null,
    tags: JSON.stringify(d.tags),
    status: d.status,
    sortOrder: d.sortOrder,
    published: d.published ? 1 : 0,
  }
}

const isUniqueError = (e: unknown) =>
  e instanceof Error && e.message.includes('UNIQUE')

// public router

export const labsPublic = new Hono()

labsPublic.get('/', (c) => {
  const rows = db
    .select()
    .from(labs)
    .where(eq(labs.published, 1))
    .orderBy(asc(labs.sortOrder), asc(labs.id))
    .all()
  return c.json(rows.map(toResponse))
})

// admin router

export const labsAdmin = new Hono()

labsAdmin.get('/', (c) => {
  const rows = db
    .select()
    .from(labs)
    .orderBy(asc(labs.sortOrder), asc(labs.id))
    .all()
  return c.json(rows.map(toResponse))
})

/** Autofill for the "new lab" form: GET /github?url=https://github.com/owner/repo */
labsAdmin.get('/github', async (c) => {
  const m = (c.req.query('url') ?? '').match(
    /github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/,
  )
  if (!m) return c.json({ error: 'Not a GitHub repo URL' }, 400)
  const [, owner, repo] = m
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-admin',
  }
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      signal: AbortSignal.timeout(5_000),
    })
    if (res.status === 404) return c.json({ error: 'Repo not found' }, 404)
    if (!res.ok) return c.json({ error: `GitHub ${res.status}` }, 502)
    const r = (await res.json()) as {
      name: string
      html_url: string
      description: string | null
      topics?: string[]
    }
    return c.json({
      slug: r.name.toLowerCase(),
      title: r.name,
      summary: r.description ?? '',
      url: r.html_url,
      tags: (r.topics ?? []).filter((t) => t !== 'labs'),
    })
  } catch {
    return c.json({ error: 'GitHub unreachable' }, 502)
  }
})

labsAdmin.post('/', async (c) => {
  const parsed = labSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400)
  try {
    const row = db.insert(labs).values(values(parsed.data)).returning().get()
    return c.json(toResponse(row), 201)
  } catch (e) {
    if (isUniqueError(e)) return c.json({ error: 'Slug already exists' }, 409)
    throw e
  }
})

labsAdmin.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const parsed = labSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400)
  try {
    const row = db
      .update(labs)
      .set({ ...values(parsed.data), updatedAt: new Date() })
      .where(eq(labs.id, id))
      .returning()
      .get()
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json(toResponse(row))
  } catch (e) {
    if (isUniqueError(e)) return c.json({ error: 'Slug already exists' }, 409)
    throw e
  }
})

labsAdmin.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db.select().from(labs).where(eq(labs.id, id)).get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(labs).where(eq(labs.id, id)).run()
  return c.json({ ok: true })
})
