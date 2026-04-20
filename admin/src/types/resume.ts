export type Section = 'profile' | 'work' | 'education' | 'skills' | 'projects'

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
