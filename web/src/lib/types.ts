export type {
  TocItem,
  Sidenote,
  BibliographyEntry,
  GlossaryEntry,
} from '@portfolio/shared/markdown/types'

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
  publishedAt: string | null
  createdAt: string
  language: string
  translationOfId: number | null
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
  html: string
  toc: import('@portfolio/shared/markdown/types').TocItem[]
  sidenotes: import('@portfolio/shared/markdown/types').Sidenote[]
  bibliography: import('@portfolio/shared/markdown/types').BibliographyEntry[]
  glossary: import('@portfolio/shared/markdown/types').GlossaryEntry[]
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
  education: {
    id: number
    school: string
    degree: string
    start: string
    end: string
    desc: string
  }[]
  skills: string[]
  projects: ResumeProjectItem[]
}
