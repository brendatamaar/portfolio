export interface Tag {
  id: number
  name: string
  slug: string
}

// Import source type from shared
export type { SourceType } from '../../../shared/types/glossary-bibliography.js'

// Admin versions (without num field since it's added by API)
export interface GlossaryEntry {
  key: string
  term: string
  definition: string
}

export interface BibliographyEntry {
  key: string
  text: string
  sourceType:
    | 'web'
    | 'docs'
    | 'journal'
    | 'article'
    | 'book'
    | 'video'
    | 'podcast'
    | 'repo'
    | 'other'
}

export interface Post {
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
  tags: Tag[]
  glossaryEn: GlossaryEntry[]
  glossaryId: GlossaryEntry[] | null
  bibliographyEn: BibliographyEntry[]
  bibliographyId: BibliographyEntry[] | null
}

export interface Image {
  id: number
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  url: string
  createdAt: string
}

export interface BookSearchResult {
  title: string
  author: string
  year: number | null
  coverUrl: string | null
}

export interface AlbumSearchResult {
  title: string
  artist: string
  year: number | null
  coverUrl: string | null
}

export interface ResumeProfile {
  locale: string
  name: string
  initials: string
  location: string
  locationLink: string
  currentJob: string
  description: string
  about: string
  summary: string
  avatarUrl: string
  personalWebsiteUrl: string
  email: string
  tel: string
  social: string
}

export interface ResumeWorkItem {
  id: number
  locale: string
  company: string
  link: string
  badge: string
  title: string
  start: string
  end: string
  description: string
  sortOrder: number
}

export interface ResumeEducationItem {
  id: number
  locale: string
  school: string
  degree: string
  start: string
  end: string
  desc: string
  sortOrder: number
}

export interface ResumeSkillItem {
  id: number
  name: string
  sortOrder: number
}

export interface ResumeProjectItem {
  id: number
  locale: string
  title: string
  type: 'side_project' | 'work'
  company: string | null
  techStack: string
  description: string
  linkLabel: string | null
  linkHref: string | null
  img: string
  isFeatured: number
  sortOrder: number
}
