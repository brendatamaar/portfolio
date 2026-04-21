import { useState, useRef, useEffect } from 'react'
import type { GlossaryEntry } from '../../../shared/markdown/types.js'
import { useScrollToRef } from '../../hooks/useScrollToRef.js'

interface GlossarySectionProps {
  glossary: GlossaryEntry[]
  contentRef: React.RefObject<HTMLDivElement | null>
}

export default function GlossarySection({
  glossary,
  contentRef,
}: GlossarySectionProps) {
  const [open, setOpen] = useState(false)
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const scrollToRef = useScrollToRef({
    contentRef,
    highlightClass: 'gloss-ref-highlighted',
  })

  useEffect(() => {
    if (innerRef.current) {
      setHeight(innerRef.current.scrollHeight)
    }
  }, [open, glossary])

  if (glossary.length === 0) return null

  return (
    <section
      id="glossary-section"
      className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
      aria-label="Glossary"
    >
      <button
        onClick={() => setOpen((o) => !o)}
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
          <dl className="m-0 space-y-3 p-0">
            {glossary.map((entry) => (
              <div
                key={entry.key}
                className="cursor-pointer border-l-3 border-[#FFE600] py-1 pl-4 transition-all hover:border-l-4 hover:bg-[#FFE600]/5"
                onClick={() => scrollToRef(`[data-gloss-key="${entry.key}"]`)}
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
      </div>
    </section>
  )
}
