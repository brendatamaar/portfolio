// The Projects list comes from the admin (Resume > Projects, side projects only).
// A project's image or animated GIF (`img`) is its hover card; no image, no card.
import { api } from '../../lib/api'
import type { ResumeProjectItem } from '../../lib/types'
import { workPreviews, type Lang } from './content'

export interface ProjectRow {
  name: string
  description: string
  /** Only set when the admin gave the project a real link. */
  href?: string
  /** Image or animated GIF URL; empty when the admin has none. */
  img: string
}

function toRow(p: ResumeProjectItem): ProjectRow {
  return {
    name: p.title,
    description: p.description,
    href: p.link?.href && p.link.href !== '#' ? p.link.href : undefined,
    img: p.img,
  }
}

async function fromAdmin(lang: Lang): Promise<ResumeProjectItem[]> {
  try {
    return (await api.getResumeData(lang)).projects.filter(
      (p) => p.type === 'side_project',
    )
  } catch {
    return []
  }
}

/**
 * Side projects as entered in the admin, featured first (otherwise the admin's order).
 * No projects in this language: use the English ones. Still none, or the API is down: [].
 */
export async function loadProjects(lang: Lang): Promise<ProjectRow[]> {
  let items = await fromAdmin(lang)
  if (!items.length && lang !== 'en') items = await fromAdmin('en')
  return [...items]
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .map(toRow)
}

// Keep GIFs at their original URL so animation is preserved. For other uploads,
// the 280px card requests a 640px webp instead of the full-size screenshot.
export const cardSrc = (img: string) =>
  img.startsWith('/uploads/') &&
  !img.includes('?') &&
  !/\.gif(?:[?#]|$)/i.test(img)
    ? `${img}?w=640`
    : img

/** Hover-card images by name: Airtax and cheSKP (intro text) plus every project that has a screenshot. */
export function previewMap(rows: ProjectRow[]): Record<string, string> {
  return Object.fromEntries(
    [...workPreviews, ...rows]
      .filter((p) => p.img)
      .map((p) => [p.name, cardSrc(p.img)]),
  )
}
