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
  const { html, toc, sidenotes } = parse(content, { glossMap, citeMap })

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
