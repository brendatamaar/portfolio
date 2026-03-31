import { useRef } from 'react'
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
