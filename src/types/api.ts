import type {
  TocItem,
  Sidenote,
  BibliographyEntry,
} from '@portfolio/shared/markdown/types.js'

export interface PostTag {
  name: string
  slug: string
}

export interface PostSummary {
  id: number
  title: string
  slug: string
  description: string
  coverImageUrl: string | null
  /** ISO date string. Null if the post was never explicitly published. */
  publishedAt: string | null
  /** ISO date string of row creation. */
  createdAt: string
  tags: PostTag[]
}

export interface PostsResponse {
  data: PostSummary[]
  total: number
  page: number
  limit: number
}

export interface PostDetail {
  post: PostSummary
  /** Server-rendered HTML from the markdown parser. */
  html: string
  toc: TocItem[]
  sidenotes: Sidenote[]
  bibliography: BibliographyEntry[]
}

export interface ResumeProfile {
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
  social: { name: string; url: string }[]
}

export interface ResumeWorkItem {
  id: number
  company: string
  link: string
  badge: string
  title: string
  start: string
  end: string
  description: string
}

export interface ResumeEducationItem {
  id: number
  school: string
  degree: string
  start: string
  end: string
  desc: string
}

export interface ResumeProjectItem {
  id: number
  title: string
  type: 'side_project' | 'work'
  company?: string
  techStack: string[]
  description: string
  link?: { label: string; href: string }
  img: string
  isFeatured: boolean
}

export interface ResumeData {
  profile: ResumeProfile | null
  work: ResumeWorkItem[]
  education: ResumeEducationItem[]
  skills: string[]
  projects: ResumeProjectItem[]
}
