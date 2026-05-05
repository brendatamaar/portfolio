import { useMemo, useRef } from 'react'
import { parse } from '@portfolio/shared/markdown/parser.js'
import type {
  BibliographyEntry as RenderBibliographyEntry,
  GlossaryEntry as RenderGlossaryEntry,
} from '@portfolio/shared/markdown/types.js'
import type { BibliographyEntry, GlossaryEntry } from '../lib/api.ts'
import MarkdownRenderer from '../../../src/components/blog/MarkdownRenderer.js'
import GlossarySection from '../../../src/components/blog/GlossarySection.js'
import BibliographySection from '../../../src/components/blog/BibliographySection.js'
import '../../../src/styles/blog.css'

interface PostPreviewModalContentProps {
  markdown: string
  glossaryEntries: GlossaryEntry[]
  bibliographyEntries: BibliographyEntry[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderGlossaryFallback(html: string, glossMap: Map<string, number>) {
  return html.replace(/\[gloss:([^\]\s]+)\]/gi, (match, key: string) => {
    const num = glossMap.get(key)
    if (!num) return match
    const escapedKey = escapeHtml(key)
    return `<sup class="gloss-ref"><a data-gloss-key="${escapedKey}">${num}</a></sup>`
  })
}

export default function PostPreviewModalContent({
  markdown,
  glossaryEntries,
  bibliographyEntries,
}: PostPreviewModalContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const { html, toc, sidenotes, glossary, bibliography } = useMemo(() => {
    const bibliography: RenderBibliographyEntry[] = bibliographyEntries.map(
      (entry, index) => ({
        ...entry,
        num: index + 1,
      }),
    )

    const glossary: RenderGlossaryEntry[] = glossaryEntries
      .map((entry, index) => ({
        ...entry,
        num: index + 1,
      }))
      .sort((a, b) => a.term.localeCompare(b.term))

    const citeMap = new Map(bibliography.map((entry) => [entry.key, entry.num]))
    const glossMap = new Map(glossary.map((entry) => [entry.key, entry.num]))
    const parsed = parse(markdown, { citeMap, glossMap })

    return {
      ...parsed,
      html: renderGlossaryFallback(parsed.html, glossMap),
      glossary,
      bibliography,
    }
  }, [bibliographyEntries, glossaryEntries, markdown])

  return (
    <>
      <main className="mx-auto max-w-[72rem] px-6 pb-12">
        <MarkdownRenderer
          html={html}
          toc={toc}
          sidenotes={sidenotes}
          bibliography={bibliography}
          glossary={glossary}
          contentRef={contentRef}
        />
      </main>

      <div className="mx-auto max-w-3xl space-y-4 px-6 pb-12">
        <GlossarySection glossary={glossary} contentRef={contentRef} />
        <BibliographySection
          bibliography={bibliography}
          contentRef={contentRef}
        />
      </div>
    </>
  )
}
