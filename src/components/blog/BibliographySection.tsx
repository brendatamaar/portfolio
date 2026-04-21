import { useState, useRef, useEffect } from 'react'
import type { BibliographyEntry } from '../../../shared/markdown/types.js'
import { useScrollToRef } from '../../hooks/useScrollToRef.js'
import { formatBibliographyText } from '../../lib/utils/bibliography.js'

interface BibliographySectionProps {
  bibliography: BibliographyEntry[]
  contentRef: React.RefObject<HTMLDivElement | null>
}

export default function BibliographySection({
  bibliography,
  contentRef,
}: BibliographySectionProps) {
  const [open, setOpen] = useState(false)
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const scrollToRef = useScrollToRef({
    contentRef,
    highlightClass: 'cite-ref-highlighted',
  })

  useEffect(() => {
    if (innerRef.current) {
      setHeight(innerRef.current.scrollHeight)
    }
  }, [open, bibliography])

  if (bibliography.length === 0) return null

  return (
    <section
      id="bibliography-section"
      className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
      aria-label="Bibliography"
    >
      <button
        onClick={() => setOpen((o) => !o)}
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
          {open ? '−' : '+'}
        </span>
      </button>

      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? `${height}px` : '0px' }}
      >
        <div
          ref={innerRef}
          className="border-t-2 border-black px-5 py-4 dark:border-white"
        >
          <ol className="m-0 list-none space-y-3 p-0">
            {bibliography.map((entry) => (
              <li
                key={entry.key}
                className="flex cursor-pointer items-baseline gap-3 border-l-3 border-[#FFE600] py-1 pl-4 transition-all hover:border-l-4 hover:bg-[#FFE600]/5"
                onClick={() => scrollToRef(`[data-cite-id="${entry.key}"]`)}
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
      </div>
    </section>
  )
}
