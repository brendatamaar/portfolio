import { useEffect, useRef, useState } from 'react'
import type { TocItem } from '../../../shared/markdown/types.js'

interface Props {
  toc: TocItem[]
}

export default function TOC({ toc }: Props) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!toc.length) return

    const headingEls = toc
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    // rootMargin clips the observation zone to the top 40% of the viewport,
    // so only headings near the top of the screen are considered "active".
    // When multiple headings are visible we take the topmost one.
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 },
    )

    headingEls.forEach((el) => observerRef.current!.observe(el))
    return () => observerRef.current?.disconnect()
  }, [toc])

  if (!toc.length) return null

  return (
    <nav className="toc sticky top-8 w-48 shrink-0 hidden lg:block" aria-label="Table of contents">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-3">
        Contents
      </p>
      <ul className="space-y-1.5">
        {toc.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 1) * 10}px` }}
          >
            <a
              href={`#${item.id}`}
              className={[
                'block text-[12px] leading-snug transition-colors',
                activeId === item.id
                  ? 'font-bold text-black dark:text-white'
                  : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white',
              ].join(' ')}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
