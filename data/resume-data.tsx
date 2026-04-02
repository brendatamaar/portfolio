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
      title: 'jpeg-encoder',
      techStack: ['side project', 'JavaScript', 'Vite'],
      description:
        'Complete JPEG baseline encoding pipeline implementing all 6 standard stages. Visualizes per-stage compression metrics including entropy, bitrate, and compression ratio.',
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
        'Offline markdown editor with split-view live preview, LaTeX math rendering, Mermaid diagram support, and synchronized scrolling.',
      logo: '',
      img: '',
      isFeatured: true,
    },
    {
      title: 'Admin Barcode',
      techStack: ['side project', 'Laravel 8', 'PostgreSQL', 'Docker'],
      description:
        'Inventory asset management system for generating and tracking barcodes/QR codes with bulk Excel import and streamed PDF output. Access controlled via RBAC.',
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
        'Enterprise multi-module tax SaaS integrated with the DJP tax system. Covers tax invoicing, non-tax revenue reporting, and taxpayer status confirmation.',
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
        'Enterprise platform designed to handle all business processes in one place: revenue management, ERP, reporting, and CRM built across 40+ operational workflows via micro-frontend architecture.',
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
        'Real-time analytics dashboard tracking OTC and recurring revenue streams with concurrent query execution for parallel aggregations.',
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
        'CRM managing sales, procurement, stock, and automated accounting with event-driven integration triggering real-time accounting posts across 8 transaction types.',
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
        'Customer satisfaction survey platform with SSO auth, multi-level role-based access, and survey analytics.',
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
        'Electric stove conversion platform managing field surveys, installation, activation, and billing verification with real-time updates and geospatial map visualization.',
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
      title: 'The Count of Monte Cristo',
      author: 'Alexandre Dumas',
      status: 'read' as const,
      tags: ['fiction', 'classic'],
    },
  ],
} as const
