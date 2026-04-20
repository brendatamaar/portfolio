export interface Tag {
  id: number
  name: string
  slug: string
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
