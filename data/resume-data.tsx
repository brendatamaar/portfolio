import { GitHubIcon, LinkedInIcon } from '@/components/icon'

export const RESUME_DATA = {
  name: 'Brendatama Akbar Ramadan',
  initials: 'BA',
  location: 'Jakarta, Indonesia',
  locationLink: 'https://www.google.com/maps/place/Jakarta',
  currentJob: 'Web Software Developer',
  description:
    'I am a web software developer specializing in designing and building applications with a focus on simplicity and usability.',
  about:
    'Specializing in crafting seamless, high-performance web experiences emphasizing simplicity and usability.🖖',
  summary:
    'I am a web software developer specializing in designing and building applications with a focus on simplicity and usability. Currently, I work at PLN Icon Plus as a Web Software Developer. Have a keen interest in tech, RPG games, and good stories.🤖',
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
      school: 'CEP CCIT University of Indonesia',
      degree: 'Associate Degree in Information Engineering, GPA: 3.7',
      start: '2017',
      end: '2019',
      desc: 'Prominent coursework: Web & Mobile App Development, Databases, Object-oriented Programming, DevOps. Developed 24 applications for monthly project using various programming languages, frameworks and APIs.',
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
      end: 'Now',
      description:
        'Working on several web products by delivering new major features.',
    },
    {
      company: 'Cipta Kreasi',
      link: '#',
      badges: '/images/cipta_kreasi.png',
      title: 'Front-End Developer',
      logo: '',
      start: '2020',
      end: '2022',
      description: 'Designed and developed SEO-optimized landing pages.',
    },
    {
      company: 'Tebuireng Telecom',
      link: '#',
      badges: '',
      title: 'Junior Front-End Developer',
      logo: '',
      start: '2019',
      end: '2020',
      description: 'Assisted in developing web components and API-integration.',
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
      techStack: ['side project', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Spotify API'],
      description:
        'Music discovery app that recommends tracks based on your favorite artists using Spotify audio feature filters.',
      logo: '',
      link: {
        label: 'skenatify',
        href: 'https://github.com/brendatamaar/skenatify',
      },
      img: '',
      isFeatured: true,
    },
    {
      title: 'poker-hand-calculator',
      techStack: ['side project', 'JavaScript', 'Vite'],
      description:
        'Hand winning probability calculator in poker using Monte Carlo simulation.',
      logo: '',
      link: {
        label: 'poker-hand-calculator',
        href: 'https://github.com/brendatamaar/poker-hand-calculator',
      },
      img: '',
      isFeatured: true,
    },
    {
      title: 'jpeg-encoder',
      techStack: ['side project', 'JavaScript', 'Vite'],
      description:
        'Complete JPEG encoding pipeline implementing all 6 standard stages including entropy, bitrate, and compression ratio.',
      logo: '',
      link: {
        label: 'jpeg-encoder',
        href: 'https://github.com/brendatamaar/jpeg-encoder',
      },
      img: '/images/jpeg-encoder.webp',
      isFeatured: true,
    },
    {
      title: 'MD Editor',
      techStack: [
        'side project',
        'React',
        'TypeScript',
        'Vite',
        'Tailwind CSS',
        'KaTeX',
        'Mermaid',
      ],
      description:
        'Markdown editor with split-view live preview, LaTeX math rendering, and Mermaid diagram support.',
      logo: '',
      link: {
        label: 'md-editor',
        href: 'https://github.com/brendatamaar/md-editor',
      },
      img: '',
      isFeatured: true,
    },
    {
      title: 'Admin Barcode',
      techStack: ['side project', 'Laravel', 'PostgreSQL', 'Docker'],
      description:
        'Inventory asset management system for generating and tracking QR codes.',
      logo: '',
      link: {
        label: 'admin-barcode',
        href: 'https://github.com/brendatamaar/admin-barcode',
      },
      img: '',
      isFeatured: false,
    },
    {
      title: 'AIR Tax',
      company: 'Icon Plus',
      techStack: [
        'work',
        'Vue 3',
        'Spring Boot',
        'Kafka',
        'JobRunr',
        'Docker',
      ],
      description:
        'Enterprise tax saas integrated with DJP. Covers tax invoicing, non-tax revenue reporting, and taxpayer status confirmation.',
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
      company: 'Icon Plus',
      techStack: [
        'work',
        'Vue 3',
        'TypeScript',
        'Tailwind CSS',
        'Vite Module Federation',
      ],
      description:
        'Platform designed to handle all business processes: revenue management, ERP, reporting, and CRM.',
      logo: '',
      img: '',
      isFeatured: false,
    },
    {
      title: 'Dashboard Revenue',
      company: 'Icon Plus',
      techStack: [
        'work',
        'React',
        'TypeScript',
        'Go',
        'GraphQL',
        'PostgreSQL',
      ],
      description:
        'Real-time analytics dashboard tracking OTC and recurring revenue streams.',
      logo: '',
      img: '',
      isFeatured: false,
    },
    {
      title: 'EMI CRM',
      company: 'Icon Plus',
      techStack: [
        'work',
        'Vue 3',
        'TypeScript',
        'Spring Boot',
        'PostgreSQL',
      ],
      description:
        'CRM managing sales, procurement, stock, and automated accounting integration.',
      logo: '',
      img: '',
      isFeatured: false,
    },
    {
      title: 'cheSKP',
      company: 'Icon Plus',
      techStack: [
        'work',
        'Vue 3',
        'TypeScript',
        'Spring Boot',
        'PostgreSQL',
      ],
      description: 'Customer satisfaction survey platform.',
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
      company: 'Icon Plus',
      techStack: [
        'work',
        'Vue 3',
        'Chart.js',
        'Leaflet',
        'Socket.IO',
        'Docker',
      ],
      description: 'Electric stove conversion platform.',
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
      tags: ['fiction', 'classic'],
    },
  ],
} as const
