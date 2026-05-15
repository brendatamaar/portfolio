export interface PostTag {
  id: number
  name: string
  slug: string
}

export interface GlossaryEntry {
  key: string
  term: string
  definition: string
}

export type BibSourceType =
  | 'web'
  | 'docs'
  | 'journal'
  | 'article'
  | 'book'
  | 'video'
  | 'podcast'
  | 'repo'
  | 'other'

export interface BibliographyEntry {
  key: string
  text: string
  sourceType: BibSourceType
}

export interface AdminPost {
  id: number
  title: string
  slug: string
  description: string
  content: string
  titleId: string | null
  descriptionId: string | null
  contentId: string | null
  status: 'draft' | 'published'
  coverImageUrl: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  tags: PostTag[]
  glossaryEn: GlossaryEntry[]
  glossaryId: GlossaryEntry[] | null
  bibliographyEn: BibliographyEntry[]
  bibliographyId: BibliographyEntry[] | null
}

export interface AdminPostSummary {
  id: number
  title: string
  slug: string
  status: 'draft' | 'published'
  publishedAt: string | null
  createdAt: string
  tags: PostTag[]
}

export interface AdminImage {
  id: number
  filename: string
  url: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  createdAt: string
}

export interface PostPayload {
  title: string
  slug?: string
  description: string
  content: string
  titleId: string
  descriptionId: string
  contentId: string
  status: 'draft' | 'published'
  coverImageUrl: string | null
  tagIds: number[]
  publishedAt: string | null
  glossaryEn: GlossaryEntry[]
  glossaryId: GlossaryEntry[]
  bibliographyEn: BibliographyEntry[]
  bibliographyId: BibliographyEntry[]
}
