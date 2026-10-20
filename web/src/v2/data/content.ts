// v2 content. Profile, work, projects and posts come from the API (edited in the admin);
// this file only holds the v2 copy and per-project notes the API has no field for.
//
// Assumptions to check (also listed in the hand-off):
// - Project notes below are translated from the Indonesian project descriptions in the resume
//   data, which carry more detail than the English ones.
// - jpeg-encoder stage names are read from the app's own report screen.
// - The skenatify screenshot in public/images is used as its cover although the API has no image.
import { api } from '../../lib/api'
import type {
  PostSummary,
  ResumeData,
  ResumeProjectItem,
} from '../../lib/types'

export const site = {
  name: 'Brendatama Akbar Ramadan',
  short: 'Brendatama',
  role: 'Web software developer',
  url: 'https://www.brendatama.dev',
  description:
    'Brendatama Akbar Ramadan builds the web side of an electricity business at PLN Icon Plus in Jakarta: revenue, tax, CRM and field platforms.',
  resume: '/pdf/Resume Brendatama Akbar (2026) - English.pdf',
  // Indonesian mains: what the source label on the diagram reads
  volts: 220,
  hertz: 50,
}

export const copy = {
  heroLead:
    'Web software developer at PLN Icon Plus, the IT arm of Indonesia’s state electricity company. Since 2022 I’ve built the screens its business runs on: revenue, tax, CRM and field work.',
  gridTitle: 'On the grid',
  gridLead: 'Products for PLN and Icon Plus, 2022 to now.',
  offTitle: 'Off grid',
  offLead: 'Built after hours, each on its own small circuit.',
  historyTitle: 'Line history',
  notesTitle: 'Notes',
  notesLead: 'Writing on what I build and what I read along the way.',
  groundTitle: 'Ground',
  groundLead:
    'Every line ends here. Hiring, a project, or a good story: write to me.',
}

export type Note = { inside: string; points?: string[]; caption?: string }

/** Detail the API has no field for, keyed by project slug. */
export const notes: Record<string, Note> = {
  'air-tax': {
    caption: 'The AIR Tax sign-in screen.',
    inside:
      'A multi-module enterprise tax platform connected to DJP, Indonesia’s tax directorate. It covers tax invoices, reporting of non-tax state revenue, and taxpayer status confirmation.',
  },
  ap2t: {
    inside:
      'One platform for the whole business: revenue management, ERP, reporting and CRM. It is built on more than 40 operational workflows, split into micro-frontends with Vite Module Federation.',
  },
  'dashboard-revenue': {
    inside:
      'A real-time analytics dashboard for one-time and recurring revenue. Queries run concurrently so every aggregation is computed in parallel.',
  },
  'emi-crm': {
    inside:
      'A CRM for sales, procurement, stock and accounting. Event-driven integration posts accounting entries in real time across 8 transaction types.',
  },
  cheskp: {
    caption: 'The cheSKP sign-in screen.',
    inside:
      'A customer satisfaction survey platform with single sign-on, multi-level role-based access and survey analytics.',
  },
  esds: {
    caption: 'The ESDS sign-in screen.',
    inside:
      'The platform behind the electric stove conversion programme: field surveys, installation, activation and bill verification, with real-time updates and a geospatial map.',
  },
  skenatify: {
    caption: 'Pick up to five artists, then ask for recommendations.',
    inside:
      'Pick up to five artists you love and it recommends tracks, filtered by Spotify’s audio features.',
  },
  'poker-hand-calculator': {
    inside:
      'It estimates a poker hand’s chance of winning by Monte Carlo simulation: deal the unknown cards at random, many times over, and count the wins.',
  },
  'jpeg-encoder': {
    caption:
      'Upload an image and the compression report fills in, stage by stage.',
    inside:
      'A complete baseline JPEG encoder written by hand. It shows what each stage does to the file: entropy, bitrate and compression ratio, stage by stage.',
    points: [
      'Colour conversion to YCbCr',
      'Chroma subsampling',
      '8×8 discrete cosine transform',
      'Quantization',
      'Zigzag and run-length coding',
      'Huffman entropy coding',
    ],
  },
  'md-editor': {
    inside:
      'An offline markdown editor with a split-view live preview, LaTeX maths through KaTeX, Mermaid diagrams and synced scrolling.',
  },
  'admin-barcode': {
    inside:
      'Inventory asset management that generates and tracks barcodes and QR codes, with bulk Excel import, streamed PDF output and role-based access.',
  },
}

/** Screenshots the API does not reference yet. */
const coverFallback: Record<string, string> = {
  skenatify: '/images/skenatify.webp',
}

/** 960px variants for phones, generated into public/v2/img for the screenshots shipped in public/images */
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
  note?: Note
  /** stable 0..1 seed for the generated diagram cover */
  seed: number
}

function seedOf(s: string) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return ((h >>> 0) % 10000) / 10000
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
    note: notes[slug],
    seed: seedOf(slug),
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

/** Work projects first (in API order), then side projects featured-first: the order of the bus. */
export function lineOrder(resume: ResumeData) {
  const all = resume.projects.map(toProject)
  const grid = all.filter((p) => p.type === 'work')
  const off = all
    .filter((p) => p.type === 'side_project')
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
  return { grid, off, all: [...grid, ...off] }
}

export function socials(resume: ResumeData) {
  return (resume.profile?.social ?? [])
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
}

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''
