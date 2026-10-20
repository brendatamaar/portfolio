// v2 content. Profile, work, education, skills, projects and posts come from the API (edited in
// the admin); this file only holds v2 copy, fallbacks for when the API is down, and per-project
// detail the API has no field for.
//
// Notes to check:
// - `details` are English translations of the longer Indonesian project descriptions in the
//   resume data (server/scripts/seed-resume.ts).
// - The skenatify screenshot in public/images is used as its cover although the API has no image.
import { api } from '../../lib/api'
import type {
  PostSummary,
  ResumeData,
  ResumeProjectItem,
} from '../../lib/types'

export type Tone = 'orange' | 'lavender' | 'coral' | 'green' | 'lime' | 'navy'

// Card colors double as the waterfall legend: the network panel colors requests by type.
export const tones: Tone[] = [
  'orange',
  'lavender',
  'coral',
  'green',
  'lime',
  'navy',
]

/** Used when the API is unreachable, and for values the API does not hold. */
export const site = {
  name: 'Brendatama Akbar',
  fullName: 'Brendatama Akbar Ramadan',
  role: 'Web Software Developer',
  location: 'Jakarta, Indonesia',
  url: 'https://www.brendatama.dev',
  email: 'brendatamaa@gmail.com',
  description:
    'I am a web software developer specializing in designing and building applications with a focus on simplicity and usability.',
  resume: encodeURI('/pdf/Resume Brendatama Akbar (2026) - English.pdf'),
  socials: [
    { label: 'GitHub', href: 'https://github.com/brendatamaar' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/brendatamaar/' },
  ],
}

/** Section copy, following the live homepage's labels. */
export const copy = {
  projects: {
    eyebrow: 'What I’ve built',
    title: 'Projects',
    note: 'Side projects and experiments. Each card opens with the stack and a link to the code or the live demo.',
  },
  live: {
    eyebrow: 'Live, from your browser',
    title: 'Every request this page made',
    note: 'Network tools color requests by type. So does this site: the colors on every card are the legend below. The numbers are yours, read from your browser just now.',
  },
  work: { eyebrow: 'Where I’ve worked', title: 'Work' },
  banner: 'Simplicity and usability, first.',
  selected: { title: 'Selected work' },
  writing: { eyebrow: 'What I’ve been thinking', title: 'Writing' },
  connect: {
    eyebrow: 'Let’s talk',
    hook: 'Have an idea?',
    line: 'I’m always open to interesting conversations, collaborations, and opportunities.',
  },
}

/** Longer project detail, keyed by slug: translated from the Indonesian descriptions. */
export const details: Record<string, string> = {
  skenatify:
    'A music discovery app that recommends songs based on your favorite artists, using Spotify’s audio feature filters.',
  'poker-hand-calculator':
    'A calculator for the probability that a poker hand wins, using Monte Carlo simulation.',
  'jpeg-encoder':
    'A complete baseline JPEG encoding pipeline that implements all 6 standard stages, and visualises the compression metrics of each stage, including entropy, bitrate and compression ratio.',
  'md-editor':
    'An offline markdown editor with a split-view live preview, LaTeX math rendering, Mermaid diagram support and synchronised scrolling.',
  'admin-barcode':
    'An inventory asset management system for creating and tracking barcodes and QR codes, with bulk Excel import and streamed PDF output. Access is controlled through RBAC.',
  'air-tax':
    'A multi-module enterprise tax SaaS integrated with the DJP (Directorate General of Taxes) systems. It covers tax invoices, non-tax state revenue reporting and taxpayer status confirmation.',
  ap2t: 'An enterprise platform that handles every business process in one place: revenue management, ERP, reporting and CRM, built on more than 40 operational workflows through a micro-frontend architecture.',
  'dashboard-revenue':
    'A real-time analytics dashboard that tracks one-time (OTC) and recurring revenue streams, running queries concurrently to aggregate in parallel.',
  'emi-crm':
    'A CRM that manages sales, procurement, stock and automated accounting, with an event-driven integration that triggers real-time accounting postings across 8 transaction types.',
  cheskp:
    'A customer satisfaction survey platform with SSO authentication, multi-level role-based access and survey analytics.',
  esds: 'An electric stove conversion platform that manages field surveys, installation, activation and bill verification, with real-time updates and geospatial map views.',
}

/** Screenshots the API does not reference yet. */
const coverFallback: Record<string, string> = {
  skenatify: '/images/skenatify.webp',
}

/** 960px variants for phones, in public/v2/img, for the screenshots shipped in public/images */
const SMALL = new Set(['airtax', 'cheskp', 'esds', 'jpeg-encoder', 'skenatify'])
export function srcset(src: string) {
  const m = src.match(/^\/images\/([\w-]+)\.webp$/)
  return m && SMALL.has(m[1])
    ? `/v2/img/${m[1]}-960.webp 960w, ${src} 1920w`
    : undefined
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export type Project = ResumeProjectItem & {
  slug: string
  cover: string
  detail: string
}

export function toProject(p: ResumeProjectItem): Project {
  const slug = slugify(p.title)
  // The API prepends the project type ("work", "side project") to the stack: not a technology
  const techStack = p.techStack.filter(
    (t) => !['work', 'side project'].includes(t.toLowerCase()),
  )
  return {
    ...p,
    techStack,
    slug,
    cover: p.img || coverFallback[slug] || '',
    detail: details[slug] ?? p.description,
  }
}

const EMPTY: ResumeData = {
  profile: null,
  work: [],
  education: [],
  skills: [],
  projects: [],
}

export async function loadResume(): Promise<ResumeData> {
  try {
    return await api.getResumeData('en')
  } catch {
    return EMPTY
  }
}

export async function loadPosts(limit = 4): Promise<PostSummary[]> {
  try {
    return (await api.getPosts('en', limit)).data
  } catch {
    return []
  }
}

/** Work projects in API order, side projects featured first. */
export function projectsOf(resume: ResumeData) {
  const all = resume.projects.map(toProject)
  const work = all.filter((p) => p.type === 'work')
  const side = all
    .filter((p) => p.type === 'side_project')
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
  return { work, side, all: [...side, ...work] }
}

export function socials(resume: ResumeData) {
  const fromApi = (resume.profile?.social ?? [])
    .filter((s) => !s.url.startsWith('mailto:'))
    .map((s) => ({
      label:
        s.name === 'github'
          ? 'GitHub'
          : s.name === 'linkedin'
            ? 'LinkedIn'
            : s.name,
      href: s.url,
    }))
  return fromApi.length ? fromApi : site.socials
}

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

export const isoDate = (iso: string | null) => (iso ? iso.slice(0, 10) : '')
