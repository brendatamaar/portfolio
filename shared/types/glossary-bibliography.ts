/**
 * Shared types for Glossary and Bibliography
 * Used by both frontend and admin
 */

// Source types for bibliography entries
export type SourceType =
  | 'web'
  | 'docs'
  | 'journal'
  | 'article'
  | 'book'
  | 'video'
  | 'podcast'
  | 'repo'
  | 'other'

// Base entry without number (for creation/editing)
export interface GlossaryEntryBase {
  term: string
  definition: string
}

export interface BibliographyEntryBase {
  key: string
  text: string
  sourceType: SourceType
}

// Entry with number (after processing)
export interface GlossaryEntry extends GlossaryEntryBase {
  num: number
}

export interface BibliographyEntry extends BibliographyEntryBase {
  num: number
}

// Source type configuration
export interface SourceTypeConfig {
  label: string
  icon: string
}

export const SOURCE_TYPE_CONFIG: Record<SourceType, SourceTypeConfig> = {
  web: { label: 'Web', icon: '🌐' },
  docs: { label: 'Docs', icon: '📖' },
  journal: { label: 'Journal', icon: '📄' },
  article: { label: 'Article', icon: '📰' },
  book: { label: 'Book', icon: '📚' },
  video: { label: 'Video', icon: '🎬' },
  podcast: { label: 'Podcast', icon: '🎙' },
  repo: { label: 'Repository', icon: '💾' },
  other: { label: 'Other', icon: '·' },
}

// Popup state types
export interface PopupPosition {
  x: number
  y: number
}

export interface PopupState<T> extends PopupPosition {
  data: T
}
