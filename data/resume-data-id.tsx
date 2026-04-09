import { GitHubIcon, LinkedInIcon } from '@/components/icon'

export const RESUME_DATA_ID = {
  name: 'Brendatama Akbar Ramadhan',
  initials: 'BA',
  location: 'Jakarta, Indonesia',
  locationLink: 'https://www.google.com/maps/place/Jakarta',
  currentJob: 'Web Software Developer',
  description:
    'Saya adalah web software developer yang berspesialisasi dalam merancang dan membangun aplikasi dengan fokus pada kesederhanaan dan kemudahan penggunaan.',
  about:
    'Spesialis dalam membangun pengalaman web yang mulus dan berperforma tinggi dengan mengutamakan kesederhanaan dan kemudahan penggunaan.🖖',
  summary:
    'Saya adalah web software developer yang berspesialisasi dalam merancang dan membangun aplikasi dengan fokus pada kesederhanaan dan kemudahan penggunaan. Saat ini, saya bekerja di PLN Icon Plus sebagai Web Software Developer. Memiliki ketertarikan pada teknologi, game RPG, dan cerita yang menarik.🤖',
  avatarUrl:
    'https://avatars.githubusercontent.com/u/15965200?s=400&u=f240353cd552d7409e345f8d367046014c99161b&v=4',
  personalWebsiteUrl: 'https://www.brendatama.xyz/',
  contact: {
    email: 'brendatamaa@gmail.com',
    tel: '+6282128947353',
    social: [
      {
        name: 'email',
        url: 'mailto:brendatamaa@gmail.com',
        icon: GitHubIcon,
      },
      {
        name: 'github',
        url: 'https://github.com/brendatamaar',
        icon: GitHubIcon,
      },
      {
        name: 'linkedin',
        url: 'https://www.linkedin.com/in/brendatamaar/',
        icon: LinkedInIcon,
      },
    ],
  },
  education: [
    {
      school: 'CEP CCIT Universitas Indonesia',
      degree: 'Diploma Teknik Informatika, IPK: 3.7',
      start: '2017',
      end: '2019',
      desc: 'Mata kuliah utama: Pengembangan Aplikasi Web & Mobile, Basis Data, Pemrograman Berorientasi Objek, DevOps. Mengembangkan 24 aplikasi untuk proyek bulanan menggunakan berbagai bahasa pemrograman, framework, dan API.',
    },
  ],
  work: [
    {
      company: 'Icon Plus',
      link: 'https://plniconplus.co.id/',
      badges: '/images/iconpln.png',
      title: 'Web Software Developer',
      logo: '',
      start: '2022',
      end: 'Sekarang',
      description:
        'Mengerjakan beberapa produk web dengan menghadirkan fitur-fitur utama baru.',
    },
    {
      company: 'Cipta Kreasi',
      link: '#',
      badges: '/images/cipta_kreasi.png',
      title: 'Front-End Developer',
      logo: '',
      start: '2020',
      end: '2022',
      description:
        'Merancang dan mengembangkan landing page yang dioptimalkan untuk SEO.',
    },
    {
      company: 'Tebuireng Telecom',
      link: '#',
      badges: '',
      title: 'Junior Front-End Developer',
      logo: '',
      start: '2019',
      end: '2020',
      description: 'Membantu pengembangan komponen web dan integrasi API.',
    },
  ],
  skills: [
    'TypeScript',
    'React',
    'NextJS',
    'Vue',
    'Tailwind',
    'NodeJS',
    'Spring Boot',
    'Quarkus',
    'Laravel',
  ],
  projects: [
    {
      title: 'skenatify',
      techStack: ['side project'],
      description:
        'Aplikasi penemuan musik yang merekomendasikan lagu berdasarkan artis favoritmu menggunakan filter fitur audio Spotify.',
      logo: '',
      link: {
        label: 'skenatify',
        href: 'https://github.com/brendatamaar/skenatify',
      },
      img: '',
      isFeatured: true,
    },
    {
      title: 'jpeg-encoder',
      techStack: ['side project', 'JavaScript', 'Vite'],
      description:
        'Pipeline encoding JPEG baseline lengkap yang mengimplementasikan 6 tahap standar. Memvisualisasikan metrik kompresi per tahap termasuk entropi, bitrate, dan rasio kompresi.',
      logo: '',
      link: {
        label: 'jpeg-encoder',
        href: 'https://jpeg-encoder.vercel.app/',
      },
      img: '/images/jpeg-encoder.webp',
      isFeatured: true,
    },
    {
      title: 'MD Editor',
      techStack: [
        'side project',
        'React 19',
        'TypeScript',
        'Vite',
        'Tailwind CSS',
        'KaTeX',
        'Mermaid',
      ],
      description:
        'Editor markdown offline dengan pratinjau langsung split-view, rendering matematika LaTeX, dukungan diagram Mermaid, dan scroll tersinkronisasi.',
      logo: '',
      img: '',
      isFeatured: true,
    },
    {
      title: 'Admin Barcode',
      techStack: ['side project', 'Laravel 8', 'PostgreSQL', 'Docker'],
      description:
        'Sistem manajemen aset inventaris untuk membuat dan melacak barcode/QR code dengan impor Excel massal dan output PDF streaming. Akses dikontrol melalui RBAC.',
      logo: '',
      img: '',
      isFeatured: false,
    },
    {
      title: 'AIR Tax',
      techStack: [
        'work',
        'Vue 3',
        'Spring Boot 3',
        'Kafka',
        'JobRunr',
        'Docker',
      ],
      description:
        'SaaS pajak enterprise multi-modul yang terintegrasi dengan sistem DJP. Mencakup faktur pajak, pelaporan penerimaan negara bukan pajak, dan konfirmasi status wajib pajak.',
      logo: '',
      link: {
        label: 'air-tax',
        href: 'https://web-blue.air.id/airtax-new',
      },
      img: '/images/airtax.webp',
      isFeatured: false,
    },
    {
      title: 'AP2T',
      techStack: [
        'work',
        'Vue 3',
        'TypeScript',
        'Tailwind CSS',
        'Vite Module Federation',
      ],
      description:
        'Platform enterprise untuk menangani semua proses bisnis dalam satu tempat: manajemen pendapatan, ERP, pelaporan, dan CRM yang dibangun di atas 40+ alur kerja operasional via arsitektur micro-frontend.',
      logo: '',
      img: '',
      isFeatured: false,
    },
    {
      title: 'Dashboard Revenue',
      techStack: [
        'work',
        'React 18',
        'TypeScript',
        'Go',
        'GraphQL',
        'PostgreSQL',
      ],
      description:
        'Dashboard analitik real-time untuk melacak aliran pendapatan OTC dan berulang dengan eksekusi query konkuren untuk agregasi paralel.',
      logo: '',
      img: '',
      isFeatured: false,
    },
    {
      title: 'EMI CRM',
      techStack: [
        'work',
        'Vue 3',
        'TypeScript',
        'Spring Boot 3',
        'Java 21',
        'PostgreSQL',
      ],
      description:
        'CRM yang mengelola penjualan, pengadaan, stok, dan akuntansi otomatis dengan integrasi event-driven yang memicu posting akuntansi real-time di 8 jenis transaksi.',
      logo: '',
      img: '',
      isFeatured: false,
    },
    {
      title: 'cheSKP',
      techStack: [
        'work',
        'Vue 3',
        'TypeScript',
        'Spring Boot 3',
        'Java 21',
        'PostgreSQL',
        'Docker Swarm',
      ],
      description:
        'Platform survei kepuasan pelanggan dengan autentikasi SSO, akses berbasis peran multi-level, dan analitik survei.',
      logo: '',
      link: {
        label: 'cheskp',
        href: 'https://cheskp-mobile.pln.co.id/',
      },
      img: '/images/cheskp.webp',
      isFeatured: false,
    },
    {
      title: 'ESDS',
      techStack: [
        'work',
        'Vue 3',
        'Chart.js',
        'Leaflet',
        'Socket.IO',
        'Docker',
      ],
      description:
        'Platform konversi kompor listrik yang mengelola survei lapangan, instalasi, aktivasi, dan verifikasi tagihan dengan pembaruan real-time dan visualisasi peta geospasial.',
      logo: '',
      link: {
        label: 'esds',
        href: 'https://isds.pln.co.id',
      },
      img: '/images/esds.webp',
      isFeatured: false,
    },
  ],
  books: [
    {
      isbn: '9780140449266',
      title: 'The Count of Monte Cristo',
      author: 'Alexandre Dumas',
      status: 'finished' as const,
      tags: ['fiksi', 'klasik'],
    },
  ],
} as const
