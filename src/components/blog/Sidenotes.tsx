import { useEffect, useRef } from 'react'
import type { SidenotesProps } from '../../lib/types.js'

export default function Sidenotes({ sidenotes, contentRef }: SidenotesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const containerEl = containerRef.current
    const contentEl = contentRef.current
    if (!containerEl || !contentEl) return

    const position = () => {
      // Phase 1: collect element pairs
      const pairs = sidenotes
        .map(({ id }) => ({
          refEl: contentEl.querySelector(
            `[data-sidenote-id="${id}"]`,
          ) as HTMLElement | null,
          noteEl: containerEl.querySelector(
            `[data-sidenote="${id}"]`,
          ) as HTMLElement | null,
        }))
        .filter(
          (p): p is { refEl: HTMLElement; noteEl: HTMLElement } =>
            p.refEl !== null && p.noteEl !== null,
        )

      // Phase 2: batch all reads (single layout recalculation)
      const containerTop =
        containerEl.getBoundingClientRect().top + window.scrollY
      const refTops = pairs.map(
        (p) => p.refEl.getBoundingClientRect().top + window.scrollY,
      )

      // Phase 3: batch all writes (no forced reflow between writes)
      pairs.forEach(({ noteEl }, i) => {
        noteEl.style.top = `${refTops[i] - containerTop}px`
      })
    }

    position()

    // requestAnimationFrame-debounced resize — avoids thrashing during live resize
    let rafId = 0
    const onResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(position)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
    }
  }, [sidenotes, contentRef])

  if (!sidenotes.length) return null

  return (
    <div
      ref={containerRef}
      className="sidenotes relative hidden w-52 shrink-0 lg:block"
      aria-label="Sidenotes"
    >
      {sidenotes.map(({ id, html }) => (
        <aside
          key={id}
          data-sidenote={id}
          className="absolute right-0 left-0 border-l-2 border-black/20 pl-3 text-[11px] leading-relaxed text-black/50 dark:border-white/20 dark:text-white/50"
          dangerouslySetInnerHTML={{
            __html: `<sup class="font-bold mr-1">[${id}]</sup>${html}`,
          }}
        />
      ))}
    </div>
  )
}
