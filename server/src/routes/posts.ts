/**
 * Public routes: GET /api/posts, GET /api/posts/:slug
 */

import { Hono } from 'hono'
import { db } from '../db/index.js'
import { posts, tags, postTags } from '../db/schema.js'
import { eq, and, desc, count, inArray } from 'drizzle-orm'
import { parse } from '../../../shared/markdown/parser.js'

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

  const postTagRows = db
    .select({ name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, post.id))
    .all()

  const useId = lang === 'id'
  const contentSrc = useId && post.contentId ? post.contentId : post.content
  const { title, description } = localizeFields(post, lang)

  // Parse glossary and bibliography from DB first
  const glossaryJson =
    useId && post.glossaryId ? post.glossaryId : post.glossaryEn
  const bibliographyJson =
    useId && post.bibliographyId ? post.bibliographyId : post.bibliographyEn

  const bibliography: Array<{
    key: string
    text: string
    num: number
    sourceType: string
  }> = JSON.parse(bibliographyJson || '[]').map(
    (b: { key: string; text: string; sourceType: string }, i: number) => ({
      ...b,
      num: i + 1,
    }),
  )

  const glossary: Array<{
    key: string
    term: string
    definition: string
    num: number
  }> = JSON.parse(glossaryJson || '[]')
    .map((g: { key: string; term: string; definition: string }, i: number) => ({
      ...g,
      num: i + 1,
    }))
    .sort((a: { term: string }, b: { term: string }) =>
      a.term.localeCompare(b.term),
    )

  // Build lookup maps for inline references
  const glossMap = new Map(glossary.map((g) => [g.key, g.num]))
  const citeMap = new Map(bibliography.map((b) => [b.key, b.num]))

  // Parse markdown with context for inline references
  const { html, toc, sidenotes } = parse(contentSrc, { glossMap, citeMap })

  return c.json({
    post: {
      id: post.id,
      title,
      slug: post.slug,
      description,
      coverImageUrl: post.coverImageUrl,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      tags: postTagRows,
    },
    html,
    toc,
    sidenotes,
    bibliography,
    glossary,
  })
})

export default app
