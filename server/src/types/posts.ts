export interface PostDetailRow {
  id: number
  title: string
  slug: string
  description: string
  titleId: string | null
  descriptionId: string | null
  content: string
  contentId: string | null
  coverImageUrl: string | null
  publishedAt: Date | null
  createdAt: Date
  glossaryEn: string
  glossaryId: string | null
  bibliographyEn: string
  bibliographyId: string | null
}

export interface StoredGlossaryEntry {
  key: string
  term: string
  definition: string
}

export interface StoredBibliographyEntry {
  key: string
  text: string
  sourceType: string
}
