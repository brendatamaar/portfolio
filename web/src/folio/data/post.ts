// Everything the post page needs, from one API call plus the post list (for "next").
import { api } from '../../lib/api'
import { readingTime } from '../../lib/utils'
import type {
  BibliographyEntry,
  GlossaryEntry,
  PostDetail,
  PostSummary,
  Sidenote,
  TocItem,
} from '../../lib/types'
import type { Lang } from './content'

export interface PostPage {
  post: PostSummary
  html: string
  mins: number
  toc: (TocItem & { num: string })[]
  minLevel: number
  glossary: GlossaryEntry[]
  bibliography: BibliographyEntry[]
  /** Footnotes; shown in the margin on wide screens. */
  sidenotes: Sidenote[]
  /** Entries for the hover/click popups: stored ones plus the plain-text fallbacks below. */
  popupGlossary: GlossaryEntry[]
  popupBibliography: BibliographyEntry[]
  next: { slug: string; title: string } | null
}

// Some posts carry their glossary/bibliography as plain-text sections in the article
// ("key: Term | definition" lines) instead of stored entries. Parse those as fallback
// popup data so the reference numbers still open the popup.
function sectionLines(html: string, id: string): string[] {
  const m = html.match(new RegExp(`<h2 id="${id}">[\s\S]*?<p>([\s\S]*?)</p>`))
  return m ? m[1].split(/<br\s*\/?>/) : []
}
const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').trim()
const LINE = /^\s*([\w-]+):\s*([^|]+)\|\s*([\s\S]*)$/

export async function loadPostPage(
  slug: string,
  lang: Lang,
): Promise<PostPage | null> {
  let data: PostDetail
  try {
    data = await api.getPost(slug, lang)
  } catch {
    return null
  }
  const { post, html } = data

  const toc = data.toc ?? []
  const minLevel = toc.length ? Math.min(...toc.map((t) => t.level)) : 2
  const counters = new Array<number>(7).fill(0)
  const numbered = toc.map((item) => {
    counters[item.level]++
    for (let l = item.level + 1; l <= 6; l++) counters[l] = 0
    return { ...item, num: counters.slice(minLevel, item.level + 1).join('.') }
  })

  const glossary = [...(data.glossary ?? [])].sort((a, b) => a.num - b.num)
  const bibliography = data.bibliography ?? []
  const fallbackGlossary = sectionLines(html, 'glossary').flatMap((line, i) => {
    const m = line.match(LINE)
    return m
      ? [
          {
            key: m[1],
            term: stripTags(m[2]),
            definition: m[3].trim(),
            num: i + 1,
          },
        ]
      : []
  })
  const fallbackBibliography = sectionLines(html, 'bibliography').flatMap(
    (line, i) => {
      const m = line.match(LINE)
      return m
        ? [
            {
              key: m[1],
              sourceType: stripTags(m[2]).toLowerCase(),
              text: stripTags(m[3]),
              num: i + 1,
            },
          ]
        : []
    },
  )

  const all = await api
    .getPosts(lang, 100)
    .then((r) => r.data)
    .catch(() => [] as PostSummary[])
  const idx = all.findIndex((p) => p.slug === slug)
  const candidate = idx > -1 ? all[idx + 1] : undefined

  return {
    post,
    html,
    mins: readingTime(html),
    toc: numbered,
    minLevel,
    glossary,
    bibliography,
    sidenotes: data.sidenotes ?? [],
    popupGlossary: [
      ...glossary,
      ...fallbackGlossary.filter((f) => !glossary.some((g) => g.key === f.key)),
    ] as GlossaryEntry[],
    popupBibliography: [
      ...bibliography,
      ...fallbackBibliography.filter(
        (f) => !bibliography.some((b) => b.key === f.key),
      ),
    ] as BibliographyEntry[],
    next: candidate ? { slug: candidate.slug, title: candidate.title } : null,
  }
}
