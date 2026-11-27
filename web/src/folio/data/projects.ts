// The Projects list comes from the admin (Resume > Projects, side projects only).
// A project's image or animated GIF (`img`) is its hover card; no image, no card.
import { api } from '../../lib/api'
import type { ResumeProjectItem } from '../../lib/types'
import { workPreviews, type Lang } from './content'

const CARD_WIDTH = 640

export interface ProjectRow {
  name: string
  description: string
  /** Only set when the admin gave the project a real link. */
  href?: string
  /** Image or animated GIF URL; empty when the admin has none. */
  img: string
  /** Natural dimensions scaled to the delivered card width, when known. */
  imgWidth?: number
  imgHeight?: number
}

function scaleToCard(
  width?: number,
  height?: number,
): { imgWidth?: number; imgHeight?: number } {
  if (!width || !height) return {}
  if (width <= CARD_WIDTH) return { imgWidth: width, imgHeight: height }
  return {
    imgWidth: CARD_WIDTH,
    imgHeight: Math.round((height * CARD_WIDTH) / width),
  }
}

function toRow(p: ResumeProjectItem): ProjectRow {
  return {
    name: p.title,
    description: p.description,
    href: p.link?.href && p.link.href !== '#' ? p.link.href : undefined,
    img: p.img,
    ...scaleToCard(p.imgWidth, p.imgHeight),
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

export function isAnimatedGif(img: string): boolean {
  return img.startsWith('/uploads/') && /\.gif(?:[?#]|$)/i.test(img)
}

// Serve uploads as 640px webp (including animated GIFs converted to looping animated webp).
export function cardSrc(img: string): string {
  if (!img.startsWith('/uploads/')) return img
  const url = new URL(img, 'http://portfolio.local')
  if (!url.searchParams.has('w')) url.searchParams.set('w', String(CARD_WIDTH))
  if (/\.gif(?:[?#]|$)/i.test(img)) url.searchParams.set('loop', '1')
  return url.pathname + url.search + url.hash
}

// Static first-frame webp poster for animated GIFs (instant paint & LCP on mobile cards).
export function cardPosterSrc(img: string): string {
  if (!isAnimatedGif(img)) return cardSrc(img)
  const url = new URL(img, 'http://portfolio.local')
  url.searchParams.set('w', String(CARD_WIDTH))
  url.searchParams.set('poster', '1')
  return url.pathname + url.search + url.hash
}

/** Hover-card images by name: Airtax and cheSKP (intro text) plus every project that has a screenshot. */
export function previewMap(rows: ProjectRow[]): Record<string, string> {
  return Object.fromEntries(
    [...workPreviews, ...rows]
      .filter((p) => p.img)
      .map((p) => [p.name, cardSrc(p.img)]),
  )
}
