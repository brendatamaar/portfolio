import { useEffect, useRef } from 'react'
import type { SidenotesProps } from '../../lib/types.js'

export default function Sidenotes({ sidenotes, contentRef }: SidenotesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current || !containerRef.current) return

    // Align each note's top edge to its inline reference marker.
    // Both elements use document-relative Y via getBoundingClientRect + scrollY,
    // then we subtract the container's own offset so the `top` value is relative
    // to the container (which is `position: relative`).
    const position = () => {
      sidenotes.forEach(({ id }) => {
        const ref = contentRef.current?.querySelector(
          `[data-sidenote-id="${id}"]`,
        ) as HTMLElement | null
        const noteEl = containerRef.current?.querySelector(
          `[data-sidenote="${id}"]`,
        ) as HTMLElement | null
        if (!ref || !noteEl) return

        const refTop = ref.getBoundingClientRect().top + window.scrollY
        const containerTop =
          containerRef.current!.getBoundingClientRect().top + window.scrollY
        noteEl.style.top = `${refTop - containerTop}px`
      })
    }

    position()

    // Debounce resize so we don't thrash layout on every pixel of resize.
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(position, 50)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
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
