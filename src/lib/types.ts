import type { RefObject } from 'react'
import type {
  TocItem,
  Sidenote,
  BibliographyEntry,
  GlossaryEntry,
} from '../../shared/markdown/types.js'

export interface TOCProps {
  toc: TocItem[]
  hasGlossary?: boolean
  hasBibliography?: boolean
}

export interface SidenotesProps {
  sidenotes: Sidenote[]
  contentRef: RefObject<HTMLDivElement | null>
}

export interface MarkdownRendererProps {
  html: string
  toc: TocItem[]
  sidenotes: Sidenote[]
  bibliography: BibliographyEntry[]
  glossary: GlossaryEntry[]
  contentRef?: RefObject<HTMLDivElement | null>
}
