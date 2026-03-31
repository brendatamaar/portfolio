import { useEffect, useRef } from 'react'
import type { Sidenote } from '../../../shared/markdown/types.js'

interface Props {
  sidenotes: Sidenote[]
  contentRef: React.RefObject<HTMLDivElement | null>
}

export default function Sidenotes({ sidenotes, contentRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current || !containerRef.current) return

    const position = () => {
      sidenotes.forEach(({ id }) => {
        const ref = contentRef.current?.querySelector(`[data-sidenote-id="${id}"]`) as HTMLElement | null
        const noteEl = containerRef.current?.querySelector(`[data-sidenote="${id}"]`) as HTMLElement | null
        if (!ref || !noteEl) return

        const refTop = ref.getBoundingClientRect().top + window.scrollY
        const containerTop = containerRef.current!.getBoundingClientRect().top + window.scrollY
        noteEl.style.top = `${refTop - containerTop}px`
      })
    }

    position()
    window.addEventListener('resize', position)
    return () => window.removeEventListener('resize', position)
  }, [sidenotes, contentRef])

  if (!sidenotes.length) return null

  return (
    <div
      ref={containerRef}
      className="sidenotes relative w-52 shrink-0 hidden lg:block"
      aria-label="Sidenotes"
    >
      {sidenotes.map(({ id, html }) => (
        <aside
          key={id}
          data-sidenote={id}
          className="absolute left-0 right-0 text-[11px] leading-relaxed text-black/50 dark:text-white/50 border-l-2 border-black/20 dark:border-white/20 pl-3"
          dangerouslySetInnerHTML={{ __html: `<sup class="font-bold mr-1">[${id}]</sup>${html}` }}
        />
      ))}
    </div>
  )
}
