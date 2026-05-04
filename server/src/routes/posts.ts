/**
 * Public routes: GET /api/posts, GET /api/posts/:slug
 */

import { Hono } from 'hono'
import { db } from '../db/index.js'
import { posts, tags, postTags } from '../db/schema.js'
import { eq, and, desc, count, inArray } from 'drizzle-orm'
import { buildPostDetail } from '../lib/postDetail.js'

const app = new Hono()

function localizeFields(
  src: {
    title: string
    titleId: string | null
    description: string
    descriptionId: string | null
  },
  lang: string | undefined,
) {
  const useId = lang === 'id'
  return {
    title: useId && src.titleId ? src.titleId : src.title,
    description:
      useId && src.descriptionId ? src.descriptionId : src.description,
  }
}

app.get('/', (c) => {
  const lang = c.req.query('lang')
  const page = Math.max(1, Number(c.req.query('page') || 1))
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 50)))
  const offset = (page - 1) * limit

  const [{ total }] = db
    .select({ total: count() })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .all()

  const pageIds = db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset)
    .all()
    .map((r) => r.id)

  if (pageIds.length === 0) {
    return c.json({ data: [], total, page, limit })
  }

  // Single LEFT JOIN on the paginated IDs — eliminates N+1 tag fetches
  const rows = db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      description: posts.description,
      titleId: posts.titleId,
      descriptionId: posts.descriptionId,
      coverImageUrl: posts.coverImageUrl,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      tagName: tags.name,
      tagSlug: tags.slug,
    })
    .from(posts)
    .leftJoin(postTags, eq(postTags.postId, posts.id))
    .leftJoin(tags, eq(tags.id, postTags.tagId))
    .where(inArray(posts.id, pageIds))
    .orderBy(desc(posts.publishedAt))
    .all()

  // Group rows by post, collecting tags
  const postMap = new Map<
    number,
    {
      id: number
      title: string
      slug: string
      description: string
      coverImageUrl: string | null
      publishedAt: Date | null
      createdAt: Date
      tags: { name: string; slug: string }[]
    }
  >()

  for (const row of rows) {
    if (!postMap.has(row.id)) {
      const { title, description } = localizeFields(row, lang)
      postMap.set(row.id, {
        id: row.id,
        title,
        slug: row.slug,
        description,
        coverImageUrl: row.coverImageUrl,
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
        tags: [],
      })
    }
    if (row.tagName && row.tagSlug) {
      postMap.get(row.id)!.tags.push({ name: row.tagName, slug: row.tagSlug })
    }
  }

  return c.json({ data: Array.from(postMap.values()), total, page, limit })
})

app.get('/:slug', (c) => {
  const slug = c.req.param('slug')
  const lang = c.req.query('lang')

  const post = db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, 'published')))
    .get()

  if (!post) return c.json({ error: 'Not found' }, 404)

  return c.json(buildPostDetail(post, lang))
})

export default app
