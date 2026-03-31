/**
 * Public routes: GET /api/posts, GET /api/posts/:slug
 */

import { Hono } from 'hono';
import { db } from '../db/index.js';
import { posts, tags, postTags } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { parse } from '../../../shared/markdown/parser.js';

const app = new Hono();

app.get('/', (c) => {
  const rows = db
    .select({
      id:            posts.id,
      title:         posts.title,
      slug:          posts.slug,
      description:   posts.description,
      coverImageUrl: posts.coverImageUrl,
      publishedAt:   posts.publishedAt,
      createdAt:     posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
    .all();

  // Attach tags to each post
  const result = rows.map((post) => {
    const postTagRows = db
      .select({ name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id))
      .all();
    return { ...post, tags: postTagRows };
  });

  return c.json(result);
});

app.get('/:slug', (c) => {
  const slug = c.req.param('slug');

  const post = db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, 'published')))
    .get();

  if (!post) return c.json({ error: 'Not found' }, 404);

  const postTagRows = db
    .select({ name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id))
    .all();

  const { html, toc, sidenotes } = parse(post.content);

  return c.json({
    post: {
      id:            post.id,
      title:         post.title,
      slug:          post.slug,
      description:   post.description,
      coverImageUrl: post.coverImageUrl,
      publishedAt:   post.publishedAt,
      createdAt:     post.createdAt,
      tags:          postTagRows,
    },
    html,
    toc,
    sidenotes,
  });
});

export default app;
