import { GitHubIcon, LinkedInIcon } from "@/components/icons";

export const RESUME_DATA_ID = {
  name: "Brendatama Akbar Ramadhan",
  initials: "BA",
  location: "Jakarta, Indonesia (GMT +07)",
  locationLink: "https://www.google.com/maps/place/Jakarta",
  currentJob: "Web Software Developer",
  about:
    "Web developer yang senang akrobatik dalam membuat aplikasi.🖖",
  summary:
    "Saat ini, saya bekerja di PLN Icon Plus sebagai Web Developer. Keahlian saya meliputi: gemar mencari masalah untuk dipecahkan, mengotak-atik kodingan dalam membuat web & apps, serta selalu penasaran dengan hal-hal yang baru. Sangat suka ngobrol terkait tech, game RPG maupun cerita yang seru.🤖",
  avatarUrl: "https://avatars.githubusercontent.com/u/15965200?s=400&u=f240353cd552d7409e345f8d367046014c99161b&v=4",
  personalWebsiteUrl: "https://brendatama.vercel.app/",
  contact: {
    email: "brendatamaa@gmail.com",
    tel: "+6282128947353",
    social: [
      {
        name: "GitHub",
        url: "https://github.com/brendatamaar",
        icon: GitHubIcon,
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/brendatamaar/",
        icon: LinkedInIcon,
      },
    ],
  },
  education: [
    {
      school: "CEP CCIT Universitas Indonesia",
      degree: "Teknik Informatika, GPA: 3.7",
      start: "2017",
      end: "2019",
      desc: "Mata Kuliah: Pengembangan Aplikasi Web & Mobile, Databases, Object-oriented Programming, DevOps. Mengembangkan 24 aplikasi untuk proyek bulanan menggunakan berbagai bahasa pemrograman, framework, dan API."
    },
  ],
  work: [
    {
      company: "PLN Icon Plus",
      link: "https://plniconplus.co.id/",
      badges: [],
      title: "Web Software Developer",
      logo: "",
      start: "2022",
      end: "Present",
      description:
        "PLN Icon Plus (ICON+) merupakan anak dari Perusahaan Listrik Negara (PLN) Indonesia yang bergerak di bidang jaringan telekomunikasi dan pengembangan perangkat lunak.",
    },
    {
      company: "Cipta Kreasi",
      link: "#",
      badges: [],
      title: "Front-End Developer",
      logo: "",
      start: "2020",
      end: "2022",
      description:
        "Cipta Kreasi adalah agensi yang menyediakan layanan Digital Marketing dan pengembangan perangkat lunak.",
    },
    {
      company: "Tebuireng Telecom",
      link: "#",
      badges: [],
      title: "Junior Front-End Developer",
      logo: "",
      start: "2019",
      end: "2020",
      description:
        "Saya membantu dalam mengembangkan komponen web dan integrasi API.",
    },
  ],
  skills: [
    "TypeScript",
    "React",
    "NextJS",
    "Vue",
    "Tailwind",
    "NodeJS", 
    "Spring Boot",
    "Quarkus",
    "Laravel",
  ],
  projects: [
    {
      title: "AIR Tax",
      techStack: [
        "Main Project",
        "Vue",
        "NodeJS",
        "Spring Boot"
      ],
      description: "Produk untuk membantu proses perhitungan, pelaporan, dan pembayaran pajak, terintegrasi langsung dengan Direktorat Jenderal Pajak (DJP) Indonesia.",
      logo: "",
      link: {
        label: "air-tax",
        href: "https://web-blue.air.id/airtax-new",
      },
      img: "/images/airtax.webp",
      isFeatured: true
    },
    {
      title: "cheSKP",
      techStack: [
        "Main Project",
        "Vue",
        "NodeJS",
        "Spring Boot",
        "Kotlin"
      ],
      description: "Platform digital untuk melakukan dan menganalisis survei kepuasan pelanggan.",
      logo: "",
      link: {
        label: "cheskp",
        href: "https://cheskp-mobile.pln.co.id/",
      },
      img: "/images/cheskp.webp",
      isFeatured: true
    },
    {
      title: "Virtual Cubicle",
      techStack: [
        "Main Project",
        "Vue",
        "NodeJS",
        "Tailwind"
      ],
      description: "Platform web untuk digitalisasi core proses bisnis PLN Enjiniring",
      logo: "",
      link: {
        label: "vc",
        href: "https://newvcubicle.plne.co.id",
      },
      img: "/images/vc.webp",
      isFeatured: true
    },
    {
      title: "ESDS",
      techStack: [
        "Main Project",
        "Vue",
        "NodeJS",
        "Kotlin"
      ],
      description: "Platform digital untuk pendataan data kompor listrik pegawai PLN.",
      logo: "",
      link: {
        label: "vc",
        href: "https://isds.pln.co.id",
      },
      img: "/images/esds.webp",
      isFeatured: true
    },
    {
      title: "CheckMATE",
      techStack: [
        "Main Project",
        "Vue",
        "NodeJS",
        "Spring Boot"
      ],
      description: "Sistem CRM untuk memantau, menganalisis, dan mengevaluasi maturity levels dari unit perusahaan PLN.",
      logo: "",
      img: "",
      isFeatured: false
    },
    {
      title: "Skenatify",
      techStack: [
        "Side Project",
        "NextJS",
        "React",
        "Tailwind",
        "Typescript",
        "Spotify API"
      ],
      description: "Rekomendasi lagu yang disesuaikan berdasarkan artis favorit Anda.",
      logo: "",
      link: {
        label: "skenatify",
        href: "https://skenatify.vercel.app/",
      },
      img: "/images/skenatify.webp",
      isFeatured: true
    },
    {
      title: "Kenali Caleg",
      techStack: [
        "Side Project",
        "React",
        "NextJS",
        "NodeJS",
        "Tailwind"
      ],
      description: "Halaman web untuk menyediakan info tentang calon legislatif untuk Pemilu Indonesia 2024.",
      logo: "",
      link: {
        label: "kenali-caleg",
        href: "https://kenali-caleg.vercel.app/",
      },
      img: "/images/kenali-caleg.webp",
      isFeatured: false
    },
      {
      title: "datatech",
      techStack: ["Side Project", "AMP", "Bootstrap"],
      description:
        "Landing page untuk perusahaan konsultan IT.",
      logo: "",
      link: {
        label: "datatech.id",
        href: "https://datatech.id/",
      },
      img: "/images/datatech.webp",
      isFeatured: true
    },
    {
      title: "Englishseed",
      techStack: ["Side Project", "Wordpress", "PHP", "Google API"],
      description:
        "Online class untuk pembelajaran bahasa Inggris tingkat TK dan SD.",
      logo: "",
      link: {
        label: "englishseed",
        href: "https://www.instagram.com/englishseed/",
      },
      img: "",
      isFeatured: false
    },
    {
      title: "Sewa-gi",
      techStack: ["Laravel", "Bootstrap", "Elasticsearch", "Google API"],
      description:
        "Dasbor manajemen sewa dan rental apartemen.",
      logo: "",
      link: {
        label: "sewagi-web",
        href: "https://sewagi-web.inspira.web.id",
      },
      img: "/images/sewagi.webp",
      isFeatured: false
    },
    {
      title: "RRW",
      techStack: [
        "Main Project",
        "Java",
        "Laravel"
      ],
      description: "Tools untuk mendata laporan performa SEO pada web.",
      logo: "",
      img: "",
      isFeatured: false
    },
    {
      title: "Translight",
      techStack: [
        "Side Project",
        "Bootstrap"
      ],
      description: "Landing page untuk perusahaan transportasi.",
      logo: "",
      img: "",
      isFeatured: false
    },
    {
      title: "Tratus",
      techStack: [
        "Main Project",
        "Java",
        "SQLite"
      ],
      description: "Mobile app untuk melihat informasi tentang tempat wisata di Jawa Barat.",
      logo: "",
      img: "",
      isFeatured: false
    },
  ],
} as const;
