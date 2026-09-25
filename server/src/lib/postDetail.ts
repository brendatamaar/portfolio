import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { postTags, tags } from '../db/schema.js'
import { parse } from '../../../shared/markdown/parser.js'
import type {
  BibliographyEntry,
  GlossaryEntry,
} from '../../../shared/markdown/types.js'
import type {
  PostDetailRow,
  StoredBibliographyEntry,
  StoredGlossaryEntry,
} from '../types/posts.js'

function localizeFields(src: PostDetailRow, lang: string | undefined) {
  const useId = lang === 'id'
  return {
    title: useId && src.titleId ? src.titleId : src.title,
    description:
      useId && src.descriptionId ? src.descriptionId : src.description,
    content: useId && src.contentId ? src.contentId : src.content,
    glossaryJson: useId && src.glossaryId ? src.glossaryId : src.glossaryEn,
    bibliographyJson:
      useId && src.bibliographyId ? src.bibliographyId : src.bibliographyEn,
  }
}

type ParseResult = ReturnType<typeof parse>

// Markdown parsing + highlighting is the most expensive part of serving a post.
// Cache per post/lang, keyed on the exact inputs so edits invalidate immediately.
const PARSE_CACHE_MAX = 200
const parseCache = new Map<string, { source: string; result: ParseResult }>()

function parseCached(
  cacheKey: string,
  content: string,
  glossMap: Map<string, number>,
  citeMap: Map<string, number>,
): ParseResult {
  const source = `${content}\u0000${JSON.stringify([...glossMap])}\u0000${JSON.stringify([...citeMap])}`
  const hit = parseCache.get(cacheKey)
  if (hit && hit.source === source) return hit.result

  const result = parse(content, { glossMap, citeMap })
  parseCache.delete(cacheKey)
  parseCache.set(cacheKey, { source, result })
  if (parseCache.size > PARSE_CACHE_MAX) {
    parseCache.delete(parseCache.keys().next().value!)
  }
  return result
}

export function buildPostDetail(post: PostDetailRow, lang: string | undefined) {
  const postTagRows = db
    .select({ name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(tags.id, postTags.tagId))
    .where(eq(postTags.postId, post.id))
    .all()

  const { title, description, content, glossaryJson, bibliographyJson } =
    localizeFields(post, lang)

  const storedBibliography = JSON.parse(
    bibliographyJson || '[]',
  ) as StoredBibliographyEntry[]
  const bibliography: BibliographyEntry[] = storedBibliography.map((b, i) => ({
    ...b,
    num: i + 1,
  }))

  const storedGlossary = JSON.parse(
    glossaryJson || '[]',
  ) as StoredGlossaryEntry[]
  const glossary: GlossaryEntry[] = storedGlossary
    .map((g, i) => ({
      ...g,
      num: i + 1,
    }))
    .sort((a, b) => a.term.localeCompare(b.term))

  const glossMap = new Map(glossary.map((g) => [g.key, g.num]))
  const citeMap = new Map(bibliography.map((b) => [b.key, b.num]))
  const { html, toc, sidenotes } = parseCached(
    `${post.id}:${lang === 'id' ? 'id' : 'en'}`,
    content,
    glossMap,
    citeMap,
  )

  return {
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
  }
}
