import type { RefObject } from 'react'
import type { TocItem, Sidenote } from '../../shared/markdown/types.js'

export interface TOCProps {
  toc: TocItem[]
}

export interface SidenotesProps {
  sidenotes: Sidenote[]
  contentRef: RefObject<HTMLDivElement | null>
}

export interface MarkdownRendererProps {
  html: string
  toc: TocItem[]
  sidenotes: Sidenote[]
}
