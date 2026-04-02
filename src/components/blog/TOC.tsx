import { useEffect, useMemo, useRef, useState } from 'react'
import type { TOCProps } from '../../lib/types.js'

export default function TOC({ toc }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!toc.length) return

    const headingEls = toc
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

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

  // Compute hierarchical section numbers (e.g. "1", "1.1", "2")
  const { numbered, minLevel } = useMemo(() => {
    if (!toc.length) return { numbered: [], minLevel: 1 }
    const min = Math.min(...toc.map((t) => t.level))
    const counters = new Array(7).fill(0)
    const items = toc.map((item) => {
      counters[item.level]++
      for (let l = item.level + 1; l <= 6; l++) counters[l] = 0
      const num = counters.slice(min, item.level + 1).join('.')
      return { ...item, num }
    })
    return { numbered: items, minLevel: min }
  }, [toc])

  if (!toc.length) return null

  return (
    <nav
      className="toc sticky top-8 hidden w-48 shrink-0 lg:block"
      aria-label="Table of contents"
    >
      <p className="mb-3 font-mono text-[10px] font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
        Contents
      </p>
      <ul className="space-y-1.5">
        {numbered.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - minLevel) * 10}px` }}
          >
            <a
              href={`#${item.id}`}
              className={[
                'block text-[12px] leading-snug transition-colors',
                activeId === item.id
                  ? 'font-bold text-black dark:text-white'
                  : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white',
              ].join(' ')}
            >
              <span className="mr-1.5 font-mono text-[10px] opacity-50">
                {item.num}
              </span>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
