import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { parse } from '@portfolio/shared/markdown/parser.js'
import type {
  BibliographyEntry as RenderBibliographyEntry,
  GlossaryEntry as RenderGlossaryEntry,
  Sidenote,
} from '@portfolio/shared/markdown/types.js'
import type { BibliographyEntry, GlossaryEntry } from '../lib/api.ts'
import './PostPreviewModalContent.css'

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

function formatBibliographyText(text: string): string {
  return escapeHtml(text)
    .replace(/&quot;(.*?)&quot;/g, '&quot;<strong>$1</strong>&quot;')
    .replace(
      /\bhttps?:\/\/[^\s<]+[^<.,:;"')\]\s]/g,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    )
}

function useScrollToContentRef(contentRef: RefObject<HTMLDivElement | null>) {
  return useCallback(
    (selector: string, highlightClass: string) => {
      const element = contentRef.current?.querySelector(
        selector,
      ) as HTMLElement | null
      if (!element) return

      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add(highlightClass)
      setTimeout(() => element.classList.remove(highlightClass), 1500)
    },
    [contentRef],
  )
}

function useInlinePopup<T>({
  contentRef,
  datasetAttr,
  findData,
}: {
  contentRef: RefObject<HTMLDivElement | null>
  datasetAttr: string
  findData: (key: string) => T | null
}) {
  const [popup, setPopup] = useState<T | null>(null)
  const [position, setPosition] = useState<{
    x: number
    y: number
    bottom: number
  } | null>(null)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest(
        `[${datasetAttr}]`,
      ) as HTMLElement | null

      if (!target) {
        if (!(event.target as HTMLElement).closest('.post-preview-popup')) {
          setPopup(null)
          setPosition(null)
        }
        return
      }

      event.preventDefault()
      const key = target.getAttribute(datasetAttr)
      if (!key) return
      const data = findData(key)
      if (!data) return

      const rect = target.getBoundingClientRect()
      setPopup(data)
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
        bottom: rect.bottom,
      })
    }

    content.addEventListener('click', handleClick)
    return () => content.removeEventListener('click', handleClick)
  }, [contentRef, datasetAttr, findData])

  return { popup, position, close: () => setPopup(null) }
}

function popupStyle(position: { x: number; y: number; bottom: number }) {
  const width = 320
  const margin = 8
  const left = Math.min(
    Math.max(position.x - width / 2, 8),
    window.innerWidth - width - 8,
  )
  const flipBelow = position.y < 120

  return {
    left,
    top: flipBelow ? position.bottom + margin : position.y - margin,
    transform: flipBelow ? undefined : 'translateY(-100%)',
  }
}

function Sidenotes({
  sidenotes,
  contentRef,
}: {
  sidenotes: Sidenote[]
  contentRef: RefObject<HTMLDivElement | null>
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const containerEl = containerRef.current
    const contentEl = contentRef.current
    if (!containerEl || !contentEl) return

    const position = () => {
      const containerTop =
        containerEl.getBoundingClientRect().top + window.scrollY
      sidenotes.forEach(({ id }) => {
        const refEl = contentEl.querySelector(
          `[data-sidenote-id="${id}"]`,
        ) as HTMLElement | null
        const noteEl = containerEl.querySelector(
          `[data-sidenote="${id}"]`,
        ) as HTMLElement | null
        if (!refEl || !noteEl) return

        noteEl.style.top = `${
          refEl.getBoundingClientRect().top + window.scrollY - containerTop
        }px`
      })
    }

    position()
    window.addEventListener('resize', position)
    return () => window.removeEventListener('resize', position)
  }, [contentRef, sidenotes])

  if (!sidenotes.length) return null

  return (
    <div
      ref={containerRef}
      className="relative hidden w-52 shrink-0 lg:block"
      aria-label="Sidenotes"
    >
      {sidenotes.map(({ id, html }) => (
        <aside
          key={id}
          data-sidenote={id}
          className="absolute right-0 left-0 border-l-2 border-black/20 pl-3 text-[11px] leading-relaxed text-black/50 dark:border-white/20 dark:text-white/50"
          dangerouslySetInnerHTML={{
            __html: `<sup class="font-bold mr-1">[${escapeHtml(id)}]</sup>${html}`,
          }}
        />
      ))}
    </div>
  )
}

function GlossarySection({
  glossary,
  contentRef,
}: {
  glossary: RenderGlossaryEntry[]
  contentRef: RefObject<HTMLDivElement | null>
}) {
  const [open, setOpen] = useState(false)
  const scrollToContentRef = useScrollToContentRef(contentRef)

  if (glossary.length === 0) return null

  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#FFE600]/10"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-black tracking-widest text-black uppercase dark:text-white">
            Glossary
          </span>
          <span className="inline-flex items-center border-2 border-black bg-[#FFE600] px-2 py-0.5 font-mono text-[10px] font-bold text-black">
            {glossary.length}
          </span>
        </span>
        <span className="font-mono text-sm font-black text-black dark:text-white">
          {open ? '-' : '+'}
        </span>
      </button>

      {open && (
        <div className="border-t-2 border-black px-5 py-4 dark:border-white">
          <dl className="m-0 space-y-3 p-0">
            {glossary.map((entry) => (
              <div
                key={entry.key}
                className="cursor-pointer border-l-3 border-[#FFE600] py-1 pl-4 transition-all hover:border-l-4 hover:bg-[#FFE600]/5"
                onClick={() =>
                  scrollToContentRef(
                    `[data-gloss-key="${entry.key}"]`,
                    'gloss-ref-highlighted',
                  )
                }
              >
                <dt className="mb-1 flex items-baseline gap-2 font-mono text-[13px] font-bold text-black dark:text-white">
                  <span className="inline-flex items-center bg-black px-1.5 py-0.5 font-mono text-[10px] font-black text-white dark:bg-white dark:text-black">
                    {entry.num}
                  </span>
                  {entry.term}
                </dt>
                <dd
                  className="m-0 pl-0 text-[14px] leading-relaxed text-black/70 dark:text-white/70"
                  dangerouslySetInnerHTML={{ __html: entry.definition }}
                />
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}

function BibliographySection({
  bibliography,
  contentRef,
}: {
  bibliography: RenderBibliographyEntry[]
  contentRef: RefObject<HTMLDivElement | null>
}) {
  const [open, setOpen] = useState(false)
  const scrollToContentRef = useScrollToContentRef(contentRef)

  if (bibliography.length === 0) return null

  return (
    <section className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#FFE600]/10"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-black tracking-widest text-black uppercase dark:text-white">
            Bibliography
          </span>
          <span className="inline-flex items-center border-2 border-black bg-[#FFE600] px-2 py-0.5 font-mono text-[10px] font-bold text-black">
            {bibliography.length}
          </span>
        </span>
        <span className="font-mono text-sm font-black text-black dark:text-white">
          {open ? '-' : '+'}
        </span>
      </button>

      {open && (
        <div className="border-t-2 border-black px-5 py-4 dark:border-white">
          <ol className="m-0 list-none space-y-3 p-0">
            {bibliography.map((entry) => (
              <li
                key={entry.key}
                className="flex cursor-pointer items-baseline gap-3 border-l-3 border-[#FFE600] py-1 pl-4 transition-all hover:border-l-4 hover:bg-[#FFE600]/5"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('a')) return
                  scrollToContentRef(
                    `[data-cite-id="${entry.key}"]`,
                    'cite-ref-highlighted',
                  )
                }}
              >
                <span className="inline-flex shrink-0 items-center border-[1.5px] border-black bg-[#FFE600] px-1.5 py-0.5 font-mono text-[10px] font-bold text-black">
                  {entry.num}
                </span>
                <span
                  className="text-[14px] leading-relaxed text-black/70 dark:text-white/70"
                  dangerouslySetInnerHTML={{
                    __html: formatBibliographyText(entry.text),
                  }}
                />
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
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

  const glossaryPopup = useInlinePopup({
    contentRef,
    datasetAttr: 'data-gloss-key',
    findData: useCallback(
      (key: string) => glossary.find((entry) => entry.key === key) ?? null,
      [glossary],
    ),
  })
  const bibliographyPopup = useInlinePopup({
    contentRef,
    datasetAttr: 'data-cite-id',
    findData: useCallback(
      (key: string) => bibliography.find((entry) => entry.key === key) ?? null,
      [bibliography],
    ),
  })

  return (
    <>
      <main className="mx-auto max-w-[72rem] px-6 pb-12">
        <div className="flex w-full items-start gap-10">
          <Sidenotes sidenotes={sidenotes} contentRef={contentRef} />
          <div
            ref={contentRef}
            className="post-preview-content min-w-0 flex-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {toc.length > 0 && (
            <nav className="sticky top-8 hidden w-48 shrink-0 lg:block">
              <p className="mb-3 font-mono text-[10px] font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
                Contents
              </p>
              <ul className="space-y-1.5">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block text-[12px] leading-snug text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </main>

      <div className="mx-auto max-w-3xl space-y-4 px-6 pb-12">
        <GlossarySection glossary={glossary} contentRef={contentRef} />
        <BibliographySection
          bibliography={bibliography}
          contentRef={contentRef}
        />
      </div>

      {glossaryPopup.popup && glossaryPopup.position && (
        <div
          className="post-preview-popup gloss-popup"
          style={popupStyle(glossaryPopup.position)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="font-mono text-[0.8rem] font-bold tracking-wide uppercase">
              {glossaryPopup.popup.term}
            </div>
            <button
              type="button"
              onClick={glossaryPopup.close}
              aria-label="Close glossary popup"
            >
              x
            </button>
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: glossaryPopup.popup.definition,
            }}
          />
        </div>
      )}

      {bibliographyPopup.popup && bibliographyPopup.position && (
        <div
          className="post-preview-popup bib-popup"
          style={popupStyle(bibliographyPopup.position)}
        >
          <button
            type="button"
            className="float-right"
            onClick={bibliographyPopup.close}
            aria-label="Close bibliography popup"
          >
            x
          </button>
          <div className="mb-2 border-l-3 border-[#FFE600] pl-2 font-mono text-[0.65rem] font-black tracking-widest uppercase">
            {bibliographyPopup.popup.sourceType}
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: formatBibliographyText(bibliographyPopup.popup.text),
            }}
          />
        </div>
      )}
    </>
  )
}
