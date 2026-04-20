export type Project = {
  readonly title: string
  readonly company?: string
  readonly techStack: readonly string[]
  readonly description: string
  readonly logo?: string
  readonly img?: string
  readonly isFeatured: boolean
  readonly link?: { readonly label: string; readonly href: string }
}

export type ProjectWithLink = Project & { link: { href: string } }

export type ProjectCardProps = {
  project: Project
  index: number
}
