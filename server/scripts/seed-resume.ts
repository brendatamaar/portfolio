/**
 * One-time seed: imports static resume data into SQLite.
 * Safe to re-run — uses INSERT OR IGNORE / INSERT OR REPLACE.
 * Run: tsx scripts/seed-resume.ts
 */

import { db } from '../src/db/index.js'
import {
  profile,
  resumeWork,
  resumeEducation,
  resumeSkills,
  resumeProjects,
} from '../src/db/schema.js'
import { runMigrations } from '../src/db/migrate.js'

runMigrations()

// ── EN data ──────────────────────────────────────────────────────────────────

const EN_PROFILE = {
  locale: 'en' as const,
  name: 'Brendatama Akbar Ramadan',
  initials: 'BA',
  location: 'Jakarta, Indonesia',
  locationLink: 'https://www.google.com/maps/place/Jakarta',
  currentJob: 'Web Software Developer',
  description:
    'I am a web software developer specializing in designing and building applications with a focus on simplicity and usability.',
  about:
    'Specializing in crafting seamless, high-performance web experiences emphasizing simplicity and usability.',
  summary:
    'I am a web software developer specializing in designing and building applications with a focus on simplicity and usability. Currently, I work at PLN Icon Plus as a Web Software Developer. Have a keen interest in tech, RPG games, and good stories.',
  avatarUrl:
    'https://avatars.githubusercontent.com/u/15965200?s=400&u=f240353cd552d7409e345f8d367046014c99161b&v=4',
  personalWebsiteUrl: 'https://www.brendatama.dev/',
  email: 'brendatamaa@gmail.com',
  tel: '+6282128947353',
  social: JSON.stringify([
    { name: 'email', url: 'mailto:brendatamaa@gmail.com' },
    { name: 'github', url: 'https://github.com/brendatamaar' },
    { name: 'linkedin', url: 'https://www.linkedin.com/in/brendatamaar/' },
  ]),
}

const ID_PROFILE = {
  locale: 'id' as const,
  name: 'Brendatama Akbar Ramadhan',
  initials: 'BA',
  location: 'Jakarta, Indonesia',
  locationLink: 'https://www.google.com/maps/place/Jakarta',
  currentJob: 'Web Software Developer',
  description:
    'Saya adalah web software developer yang berspesialisasi dalam merancang dan membangun aplikasi dengan fokus pada kesederhanaan dan kemudahan penggunaan.',
  about:
    'Spesialis dalam membangun pengalaman web yang mulus dan berperforma tinggi dengan mengutamakan kesederhanaan dan kemudahan penggunaan.',
  summary:
    'Saya adalah web software developer yang berspesialisasi dalam merancang dan membangun aplikasi dengan fokus pada kesederhanaan dan kemudahan penggunaan. Saat ini, saya bekerja di PLN Icon Plus sebagai Web Software Developer. Memiliki ketertarikan pada teknologi, game RPG, dan cerita yang menarik.',
  avatarUrl:
    'https://avatars.githubusercontent.com/u/15965200?s=400&u=f240353cd552d7409e345f8d367046014c99161b&v=4',
  personalWebsiteUrl: 'https://www.brendatama.dev/',
  email: 'brendatamaa@gmail.com',
  tel: '+6282128947353',
  social: JSON.stringify([
    { name: 'email', url: 'mailto:brendatamaa@gmail.com' },
    { name: 'github', url: 'https://github.com/brendatamaar' },
    { name: 'linkedin', url: 'https://www.linkedin.com/in/brendatamaar/' },
  ]),
}

const EN_WORK = [
  {
    locale: 'en' as const,
    company: 'Icon Plus',
    link: 'https://plniconplus.co.id/',
    badge: '/images/iconpln.png',
    title: 'Web Software Developer',
    start: '2022',
    end: 'Now',
    description:
      'Working on several web products by delivering new major features.',
    sortOrder: 0,
  },
  {
    locale: 'en' as const,
    company: 'Cipta Kreasi',
    link: '#',
    badge: '/images/cipta_kreasi.png',
    title: 'Front-End Developer',
    start: '2020',
    end: '2022',
    description: 'Designed and developed SEO-optimized landing pages.',
    sortOrder: 1,
  },
  {
    locale: 'en' as const,
    company: 'Tebuireng Telecom',
    link: '#',
    badge: '',
    title: 'Junior Front-End Developer',
    start: '2019',
    end: '2020',
    description: 'Assisted in developing web components and API-integration.',
    sortOrder: 2,
  },
]

const ID_WORK = [
  {
    locale: 'id' as const,
    company: 'Icon Plus',
    link: 'https://plniconplus.co.id/',
    badge: '/images/iconpln.png',
    title: 'Web Software Developer',
    start: '2022',
    end: 'Sekarang',
    description:
      'Mengerjakan beberapa produk web dengan menghadirkan fitur-fitur utama baru.',
    sortOrder: 0,
  },
  {
    locale: 'id' as const,
    company: 'Cipta Kreasi',
    link: '#',
    badge: '/images/cipta_kreasi.png',
    title: 'Front-End Developer',
    start: '2020',
    end: '2022',
    description:
      'Merancang dan mengembangkan landing page yang dioptimalkan untuk SEO.',
    sortOrder: 1,
  },
  {
    locale: 'id' as const,
    company: 'Tebuireng Telecom',
    link: '#',
    badge: '',
    title: 'Junior Front-End Developer',
    start: '2019',
    end: '2020',
    description: 'Membantu pengembangan komponen web dan integrasi API.',
    sortOrder: 2,
  },
]

const EN_EDUCATION = [
  {
    locale: 'en' as const,
    school: 'CEP CCIT University of Indonesia',
    degree: 'Associate Degree in Information Engineering, GPA: 3.7',
    start: '2017',
    end: '2019',
    desc: 'Prominent coursework: Web & Mobile App Development, Databases, Object-oriented Programming, DevOps. Developed 24 applications for monthly project using various programming languages, frameworks and APIs.',
    sortOrder: 0,
  },
]

const ID_EDUCATION = [
  {
    locale: 'id' as const,
    school: 'CEP CCIT Universitas Indonesia',
    degree: 'Diploma Teknik Informatika, IPK: 3.7',
    start: '2017',
    end: '2019',
    desc: 'Mata kuliah utama: Pengembangan Aplikasi Web & Mobile, Basis Data, Pemrograman Berorientasi Objek, DevOps. Mengembangkan 24 aplikasi untuk proyek bulanan menggunakan berbagai bahasa pemrograman, framework, dan API.',
    sortOrder: 0,
  },
]

const SKILLS = [
  'TypeScript',
  'React',
  'NextJS',
  'Vue',
  'Tailwind',
  'NodeJS',
  'Spring Boot',
  'Quarkus',
  'Laravel',
]

const EN_PROJECTS = [
  {
    locale: 'en' as const,
    title: 'skenatify',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify([
      'Next.js',
      'TypeScript',
      'Tailwind CSS',
      'Spotify API',
    ]),
    description:
      'Music discovery app that recommends tracks based on your favorite artists using Spotify audio feature filters.',
    linkLabel: 'skenatify',
    linkHref: 'https://github.com/brendatamaar/skenatify',
    img: '',
    isFeatured: 1,
    sortOrder: 0,
  },
  {
    locale: 'en' as const,
    title: 'poker-hand-calculator',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify(['JavaScript', 'Vite']),
    description:
      'Hand winning probability calculator in poker using Monte Carlo simulation.',
    linkLabel: 'poker-hand-calculator',
    linkHref: 'https://github.com/brendatamaar/poker-hand-calculator',
    img: '',
    isFeatured: 1,
    sortOrder: 1,
  },
  {
    locale: 'en' as const,
    title: 'jpeg-encoder',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify(['JavaScript', 'Vite']),
    description:
      'Complete JPEG encoding pipeline implementing all 6 standard stages including entropy, bitrate, and compression ratio.',
    linkLabel: 'jpeg-encoder',
    linkHref: 'https://github.com/brendatamaar/jpeg-encoder',
    img: '/images/jpeg-encoder.webp',
    isFeatured: 1,
    sortOrder: 2,
  },
  {
    locale: 'en' as const,
    title: 'MD Editor',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify([
      'React',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'KaTeX',
      'Mermaid',
    ]),
    description:
      'Markdown editor with split-view live preview, LaTeX math rendering, and Mermaid diagram support.',
    linkLabel: 'md-editor',
    linkHref: 'https://github.com/brendatamaar/md-editor',
    img: '',
    isFeatured: 1,
    sortOrder: 3,
  },
  {
    locale: 'en' as const,
    title: 'Admin Barcode',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify(['Laravel', 'PostgreSQL', 'Docker']),
    description:
      'Inventory asset management system for generating and tracking QR codes.',
    linkLabel: 'admin-barcode',
    linkHref: 'https://github.com/brendatamaar/admin-barcode',
    img: '',
    isFeatured: 0,
    sortOrder: 4,
  },
  {
    locale: 'en' as const,
    title: 'AIR Tax',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'Spring Boot',
      'Kafka',
      'JobRunr',
      'Docker',
    ]),
    description:
      'Enterprise tax saas integrated with DJP. Covers tax invoicing, non-tax revenue reporting, and taxpayer status confirmation.',
    linkLabel: 'air-tax',
    linkHref: 'https://web-blue.air.id/airtax-new',
    img: '/images/airtax.webp',
    isFeatured: 0,
    sortOrder: 5,
  },
  {
    locale: 'en' as const,
    title: 'AP2T',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'TypeScript',
      'Tailwind CSS',
      'Vite Module Federation',
    ]),
    description:
      'Platform designed to handle all business processes: revenue management, ERP, reporting, and CRM.',
    linkLabel: null,
    linkHref: null,
    img: '',
    isFeatured: 0,
    sortOrder: 6,
  },
  {
    locale: 'en' as const,
    title: 'Dashboard Revenue',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'React',
      'TypeScript',
      'Go',
      'GraphQL',
      'PostgreSQL',
    ]),
    description:
      'Real-time analytics dashboard tracking OTC and recurring revenue streams.',
    linkLabel: null,
    linkHref: null,
    img: '',
    isFeatured: 0,
    sortOrder: 7,
  },
  {
    locale: 'en' as const,
    title: 'EMI CRM',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'TypeScript',
      'Spring Boot',
      'PostgreSQL',
    ]),
    description:
      'CRM managing sales, procurement, stock, and automated accounting integration.',
    linkLabel: null,
    linkHref: null,
    img: '',
    isFeatured: 0,
    sortOrder: 8,
  },
  {
    locale: 'en' as const,
    title: 'cheSKP',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'TypeScript',
      'Spring Boot',
      'PostgreSQL',
    ]),
    description: 'Customer satisfaction survey platform.',
    linkLabel: 'cheskp',
    linkHref: 'https://cheskp-mobile.pln.co.id/',
    img: '/images/cheskp.webp',
    isFeatured: 0,
    sortOrder: 9,
  },
  {
    locale: 'en' as const,
    title: 'ESDS',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'Chart.js',
      'Leaflet',
      'Socket.IO',
      'Docker',
    ]),
    description: 'Electric stove conversion platform.',
    linkLabel: 'esds',
    linkHref: 'https://isds.pln.co.id',
    img: '/images/esds.webp',
    isFeatured: 0,
    sortOrder: 10,
  },
]

const ID_PROJECTS = [
  {
    locale: 'id' as const,
    title: 'skenatify',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify([]),
    description:
      'Aplikasi penemuan musik yang merekomendasikan lagu berdasarkan artis favoritmu menggunakan filter fitur audio Spotify.',
    linkLabel: 'skenatify',
    linkHref: 'https://github.com/brendatamaar/skenatify',
    img: '',
    isFeatured: 1,
    sortOrder: 0,
  },
  {
    locale: 'id' as const,
    title: 'poker-hand-calculator',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify(['JavaScript', 'Vite']),
    description:
      'Kalkulator probabilitas menang tangan di poker menggunakan simulasi Monte Carlo.',
    linkLabel: 'poker-hand-calculator',
    linkHref: 'https://github.com/brendatamaar/poker-hand-calculator',
    img: '',
    isFeatured: 1,
    sortOrder: 1,
  },
  {
    locale: 'id' as const,
    title: 'jpeg-encoder',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify(['JavaScript', 'Vite']),
    description:
      'Pipeline encoding JPEG baseline lengkap yang mengimplementasikan 6 tahap standar. Memvisualisasikan metrik kompresi per tahap termasuk entropi, bitrate, dan rasio kompresi.',
    linkLabel: 'jpeg-encoder',
    linkHref: 'https://jpeg-encoder.vercel.app/',
    img: '/images/jpeg-encoder.webp',
    isFeatured: 1,
    sortOrder: 2,
  },
  {
    locale: 'id' as const,
    title: 'MD Editor',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify([
      'React 19',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'KaTeX',
      'Mermaid',
    ]),
    description:
      'Editor markdown offline dengan pratinjau langsung split-view, rendering matematika LaTeX, dukungan diagram Mermaid, dan scroll tersinkronisasi.',
    linkLabel: null,
    linkHref: null,
    img: '',
    isFeatured: 1,
    sortOrder: 3,
  },
  {
    locale: 'id' as const,
    title: 'Admin Barcode',
    type: 'side_project' as const,
    company: null,
    techStack: JSON.stringify(['Laravel 8', 'PostgreSQL', 'Docker']),
    description:
      'Sistem manajemen aset inventaris untuk membuat dan melacak barcode/QR code dengan impor Excel massal dan output PDF streaming. Akses dikontrol melalui RBAC.',
    linkLabel: null,
    linkHref: null,
    img: '',
    isFeatured: 0,
    sortOrder: 4,
  },
  {
    locale: 'id' as const,
    title: 'AIR Tax',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'Spring Boot 3',
      'Kafka',
      'JobRunr',
      'Docker',
    ]),
    description:
      'SaaS pajak enterprise multi-modul yang terintegrasi dengan sistem DJP. Mencakup faktur pajak, pelaporan penerimaan negara bukan pajak, dan konfirmasi status wajib pajak.',
    linkLabel: 'air-tax',
    linkHref: 'https://web-blue.air.id/airtax-new',
    img: '/images/airtax.webp',
    isFeatured: 0,
    sortOrder: 5,
  },
  {
    locale: 'id' as const,
    title: 'AP2T',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'TypeScript',
      'Tailwind CSS',
      'Vite Module Federation',
    ]),
    description:
      'Platform enterprise untuk menangani semua proses bisnis dalam satu tempat: manajemen pendapatan, ERP, pelaporan, dan CRM yang dibangun di atas 40+ alur kerja operasional via arsitektur micro-frontend.',
    linkLabel: null,
    linkHref: null,
    img: '',
    isFeatured: 0,
    sortOrder: 6,
  },
  {
    locale: 'id' as const,
    title: 'Dashboard Revenue',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'React 18',
      'TypeScript',
      'Go',
      'GraphQL',
      'PostgreSQL',
    ]),
    description:
      'Dashboard analitik real-time untuk melacak aliran pendapatan OTC dan berulang dengan eksekusi query konkuren untuk agregasi paralel.',
    linkLabel: null,
    linkHref: null,
    img: '',
    isFeatured: 0,
    sortOrder: 7,
  },
  {
    locale: 'id' as const,
    title: 'EMI CRM',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'TypeScript',
      'Spring Boot 3',
      'Java 21',
      'PostgreSQL',
    ]),
    description:
      'CRM yang mengelola penjualan, pengadaan, stok, dan akuntansi otomatis dengan integrasi event-driven yang memicu posting akuntansi real-time di 8 jenis transaksi.',
    linkLabel: null,
    linkHref: null,
    img: '',
    isFeatured: 0,
    sortOrder: 8,
  },
  {
    locale: 'id' as const,
    title: 'cheSKP',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'TypeScript',
      'Spring Boot 3',
      'Java 21',
      'PostgreSQL',
      'Docker Swarm',
    ]),
    description:
      'Platform survei kepuasan pelanggan dengan autentikasi SSO, akses berbasis peran multi-level, dan analitik survei.',
    linkLabel: 'cheskp',
    linkHref: 'https://cheskp-mobile.pln.co.id/',
    img: '/images/cheskp.webp',
    isFeatured: 0,
    sortOrder: 9,
  },
  {
    locale: 'id' as const,
    title: 'ESDS',
    type: 'work' as const,
    company: 'Icon Plus',
    techStack: JSON.stringify([
      'Vue 3',
      'Chart.js',
      'Leaflet',
      'Socket.IO',
      'Docker',
    ]),
    description:
      'Platform konversi kompor listrik yang mengelola survei lapangan, instalasi, aktivasi, dan verifikasi tagihan dengan pembaruan real-time dan visualisasi peta geospasial.',
    linkLabel: 'esds',
    linkHref: 'https://isds.pln.co.id',
    img: '/images/esds.webp',
    isFeatured: 0,
    sortOrder: 10,
  },
]

// ── Insert ────────────────────────────────────────────────────────────────────

db.insert(profile)
  .values([EN_PROFILE, ID_PROFILE])
  .onConflictDoUpdate({
    target: profile.locale,
    set: { name: EN_PROFILE.name },
  })
  .run()

db.delete(resumeWork).run()
db.insert(resumeWork)
  .values([...EN_WORK, ...ID_WORK])
  .run()

db.delete(resumeEducation).run()
db.insert(resumeEducation)
  .values([...EN_EDUCATION, ...ID_EDUCATION])
  .run()

db.delete(resumeSkills).run()
db.insert(resumeSkills)
  .values(SKILLS.map((name, i) => ({ name, sortOrder: i })))
  .run()

db.delete(resumeProjects).run()
db.insert(resumeProjects)
  .values([...EN_PROJECTS, ...ID_PROJECTS])
  .run()

console.log('Resume data seeded successfully.')
