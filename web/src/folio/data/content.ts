// All copy for the one-column homepage (EN + ID). Pages render from this file;
// blog posts are the only thing that comes from the API (see ./posts.ts).

export type Lang = 'en' | 'id'

export const site = {
  name: 'Brendatama Akbar Ramadan',
  email: 'brendatamaa@gmail.com',
  location: 'Jakarta',
  url: 'https://www.brendatama.dev',
  iconPlusUrl: 'https://plniconplus.co.id',
  /** The resume in web/public, downloaded from the header */
  resume: '/Brendatama Akbar (2026) - English.pdf',
}

/** "© <current year> Brendatama Akbar Ramadan". The year is read when the page is rendered. */
export const copyright = () => `© ${new Date().getFullYear()} ${site.name}`

/** Where each language lives. */
export const homePath: Record<Lang, string> = { en: '/', id: '/id' }

export const socials = {
  github: { label: 'GitHub', href: 'https://github.com/brendatamaar' },
  linkedin: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/brendatamaar/',
  },
} as const
export type SocialId = keyof typeof socials

// --- hero text ---------------------------------------------------------------
// The intro is a list of segments so the page can add icons, pen marks and
// preview triggers without building HTML strings.
export type IntroSeg =
  | string
  | { k: 'ts' | 'go' | 'ip' } // icon + emphasised name (Icon Plus also gets the pen underline)
  | { k: 'pv'; name: string } // dotted underline, hover shows the preview card
  | { k: 'ring'; text: string } // hand-drawn loop
export type ReachSeg = string | { k: 'link'; id: SocialId } | { k: 'mail' }

interface Copy {
  /** document <title> / meta description */
  title: string
  description: string
  role: string
  intro: IntroSeg[]
  reach: ReachSeg[]
  projects: string
  blog: string
  noPosts: string
  noProjects: string
  /** aria-labels */
  homeLabel: string
  /** header link to the blog */
  writing: string
  /** header link that downloads the resume */
  resume: string
  /** aria-label of the sidenotes column */
  notes: string
  skip: string
  themeLabel: (next: 'light' | 'dark') => string
}

export const copy: Record<Lang, Copy> = {
  en: {
    title: 'Brendatama Akbar Ramadan',
    description:
      'Brendatama Akbar Ramadan is a software engineer building things with TypeScript, currently at Icon Plus developing Airtax and cheSKP, and making stuff around AI agents on the side.',
    role: 'Software Engineer',
    intro: [
      'I build things with ',
      { k: 'ts' },
      '. Currently at ',
      { k: 'ip' },
      ' developing ',
      { k: 'pv', name: 'Airtax' },
      ' and ',
      { k: 'pv', name: 'cheSKP' },
      '. I make stuff around ',
      { k: 'ring', text: 'AI agents' },
      ' too: sandboxes, verification, and guardrails.',
    ],
    reach: [
      'I’m always open to interesting conversations, collaborations, and opportunities. You can reach me on ',
      { k: 'link', id: 'github' },
      ' and ',
      { k: 'link', id: 'linkedin' },
      ', or at ',
      { k: 'mail' },
      '.',
    ],
    projects: 'Projects',
    blog: 'Blog',
    noPosts: 'No posts yet.',
    noProjects: 'No projects yet.',
    homeLabel: 'Brendatama Akbar Ramadan, home',
    writing: 'Writing',
    resume: 'Resume',
    notes: 'Sidenotes',
    skip: 'Skip to content',
    themeLabel: (next) => `Switch to ${next} theme`,
  },
  id: {
    title: 'Brendatama Akbar Ramadan',
    description:
      'Brendatama Akbar Ramadan adalah software engineer yang membangun produk dengan TypeScript dan Go di Icon Plus, serta tool untuk AI agent di luar jam kerja.',
    role: 'Software Engineer',
    intro: [
      'Saya mengembangkan produk dengan ',
      { k: 'ts' },
      ' dan ',
      { k: 'go' },
      ' di ',
      { k: 'ip' },
      '. Saya memelihara ',
      { k: 'pv', name: 'Airtax' },
      ' dan ',
      { k: 'pv', name: 'cheSKP' },
      ', dan di luar itu saya membangun hal-hal seputar ',
      { k: 'ring', text: 'AI agent' },
      ': sandbox, verifikasi, dan guardrail.',
    ],
    reach: [
      'Saya selalu terbuka untuk obrolan menarik, kolaborasi, dan peluang baru. Hubungi saya lewat ',
      { k: 'link', id: 'github' },
      ', ',
      { k: 'link', id: 'linkedin' },
      ', atau di ',
      { k: 'mail' },
      '.',
    ],
    projects: 'Proyek',
    blog: 'Blog',
    noPosts: 'Belum ada tulisan.',
    noProjects: 'Belum ada proyek.',
    homeLabel: 'Brendatama Akbar Ramadan, beranda',
    writing: 'Tulisan',
    resume: 'Resume',
    notes: 'Catatan samping',
    skip: 'Lewati ke konten',
    themeLabel: (next) =>
      `Ganti ke tema ${next === 'light' ? 'terang' : 'gelap'}`,
  },
}

// --- project hover images ----------------------------------------------------
/** Hover card: just a picture. `img` is a root-relative URL (public/ or /uploads/). */
export interface Preview {
  name: string
  img: string
}

/** Maintained at work: only used for the hover card on the intro text. */
export const workPreviews: Preview[] = [
  { name: 'Airtax', img: '/images/airtax.webp' },
  { name: 'cheSKP', img: '/images/cheskp.webp' },
]

// --- blog + 404 ---------------------------------------------------------------
export const blogPath = (lang: Lang) => (lang === 'id' ? '/id/blog' : '/blog')
export const postPath = (lang: Lang, slug: string) =>
  `${blogPath(lang)}/${slug}`

interface BlogCopy {
  title: string
  description: string
  lede: string
  empty: string
  back: string
  minRead: (n: number) => string
  copyLink: string
  copied: string
  contents: string
  glossary: string
  bibliography: string
  next: string
  read: string
  notFoundPage: string
  notFoundPost: string
  /** "Head back to the [home page] or read the [blog]." as text, link, text, link, text */
  notFoundLinks: [string, string, string, string, string]
  notFoundTitle: string
  notFoundDescription: string
  postNotFoundDescription: string
}

export const blog: Record<Lang, BlogCopy> = {
  en: {
    title: 'Blog',
    description:
      'Writing by Brendatama Akbar Ramadan on software, design and AI agents.',
    lede: 'Notes from my head.',
    empty: 'No posts yet.',
    back: '← Blog',
    minRead: (n) => `${n} min read`,
    copyLink: 'Copy link',
    copied: 'Copied!',
    contents: 'Contents',
    glossary: 'Glossary',
    bibliography: 'Bibliography',
    next: 'Next',
    read: 'Read →',
    notFoundPage:
      'Nothing lives at this address. It may have moved, or the link may be mistyped.',
    notFoundPost:
      'That post isn’t here. It may have been renamed, unpublished, or never existed.',
    notFoundLinks: [
      'Head back to the ',
      'home page',
      ' or read the ',
      'blog',
      '.',
    ],
    notFoundTitle: 'Not found',
    notFoundDescription: 'This address returned 404.',
    postNotFoundDescription: 'This post isn’t part of the blog.',
  },
  id: {
    title: 'Blog',
    description:
      'Tulisan Brendatama Akbar Ramadan tentang software, AI agent, dan web.',
    lede: 'Catatan seputar software, AI agent, dan web.',
    empty: 'Belum ada tulisan.',
    back: '← Blog',
    minRead: (n) => `${n} menit baca`,
    copyLink: 'Salin tautan',
    copied: 'Tersalin!',
    contents: 'Daftar isi',
    glossary: 'Glosarium',
    bibliography: 'Daftar pustaka',
    next: 'Berikutnya',
    read: 'Baca →',
    notFoundPage:
      'Tidak ada apa pun di alamat ini. Mungkin sudah dipindahkan, atau tautannya salah ketik.',
    notFoundPost:
      'Tulisan itu tidak ada di sini. Mungkin namanya diganti, ditarik, atau memang belum pernah ada.',
    notFoundLinks: ['Kembali ke ', 'beranda', ' atau baca ', 'blog', '.'],
    notFoundTitle: 'Tidak ditemukan',
    notFoundDescription: 'Alamat ini mengembalikan 404.',
    postNotFoundDescription: 'Tulisan ini tidak ada di blog.',
  },
}
