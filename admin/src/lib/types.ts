export type { BookItem, AlbumItem } from '@portfolio/shared/types/content.js'
export type { Lang } from '@portfolio/shared/types/common.js'

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
  description: string
  status: 'draft' | 'published'
  coverImageUrl: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
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

export type ResumeSection =
  | 'profile'
  | 'work'
  | 'education'
  | 'skills'
  | 'projects'
export type CollectionTab = 'books' | 'albums'

export type WorkDraft = {
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

export type EduDraft = {
  locale: string
  school: string
  degree: string
  start: string
  end: string
  desc: string
  sortOrder: number
}

export type ProjectDraft = {
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

export interface CollectionBaseItem {
  id: number
  title: string
  featured: boolean
  year: number | null
  coverUrl: string | null
}

export interface CollectionBaseSearchResult {
  title: string
  coverUrl: string | null
  year: number | null
}
