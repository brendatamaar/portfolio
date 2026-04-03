/**
 * Public routes: GET /api/posts, GET /api/posts/:slug
 */

import { Hono } from 'hono'
import { db } from '../db/index.js'
import { posts, tags, postTags } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { parse } from '../../../shared/markdown/parser.js'

const app = new Hono()

app.get('/', (c) => {
  const lang = c.req.query('lang')

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
    })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
    .all()

  // Attach tags and apply i18n fallback
  const result = rows.map((post) => {
    const postTagRows = db
      .select({ name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id))
      .all()

    const useId = lang === 'id'
    return {
      id: post.id,
      title: useId && post.titleId ? post.titleId : post.title,
      slug: post.slug,
      description:
        useId && post.descriptionId ? post.descriptionId : post.description,
      coverImageUrl: post.coverImageUrl,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      tags: postTagRows,
    }
  })

  return c.json(result)
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
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id))
    .all()

  const useId = lang === 'id'
  const contentSrc = useId && post.contentId ? post.contentId : post.content
  const { html, toc, sidenotes } = parse(contentSrc)

  return c.json({
    post: {
      id: post.id,
      title: useId && post.titleId ? post.titleId : post.title,
      slug: post.slug,
      description:
        useId && post.descriptionId ? post.descriptionId : post.description,
      coverImageUrl: post.coverImageUrl,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      tags: postTagRows,
    },
    html,
    toc,
    sidenotes,
  })
})

export default app
