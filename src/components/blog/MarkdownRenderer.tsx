import { useRef, useEffect } from 'react'
import type { Sidenote, TocItem } from '../../../shared/markdown/types.js'
import Sidenotes from './Sidenotes.js'
import TOC from './TOC.js'

interface Props {
  html: string
  toc: TocItem[]
  sidenotes: Sidenote[]
}

export default function MarkdownRenderer({ html, toc, sidenotes }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pres = contentRef.current?.querySelectorAll('pre')
    pres?.forEach(pre => {
      if (pre.querySelector('.copy-btn')) return
      const btn = document.createElement('button')
      btn.className = 'copy-btn font-mono text-[10px] uppercase tracking-widest border-2 border-black px-2 py-0.5 bg-white text-black hover:bg-[#FFE600] transition-colors absolute top-2 right-2 shadow-[2px_2px_0px_#000]'
      btn.textContent = 'copy'
      btn.onclick = async () => {
        await navigator.clipboard.writeText(pre.querySelector('code')?.textContent ?? '')
        btn.textContent = 'copied!'
        setTimeout(() => { btn.textContent = 'copy' }, 2000)
      }
      pre.style.position = 'relative'
      pre.appendChild(btn)
    })
  }, [html])

  return (
    <div className="blog-layout flex gap-10 items-start w-full">
      {/* Left: sidenotes (desktop only) */}
      <Sidenotes sidenotes={sidenotes} contentRef={contentRef} />

      {/* Center: article content */}
      <div
        ref={contentRef}
        className="blog-content prose-custom min-w-0 flex-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Right: TOC (desktop only) */}
      <TOC toc={toc} />
    </div>
  )
}
