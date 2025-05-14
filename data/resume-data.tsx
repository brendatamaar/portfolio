import { GitHubIcon, LinkedInIcon } from "@/components/icon";

export const RESUME_DATA = {
  name: "Brendatama Akbar Ramadan",
  initials: "BA",
  location: "Jakarta, Indonesia (GMT +07)",
  locationLink: "https://www.google.com/maps/place/Jakarta",
  currentJob: "Web Software Developer",
  description: "I am a web software developer specializing in designing and building applications with a focus on simplicity and usability.",
  about:
    "Specializing in designing and building web applications with focus on simplicity and usability.🖖",
  summary:
    "I am a web software developer specializing in designing and building applications with a focus on simplicity and usability. Currently, I work at PLN Icon Plus as a Web Software Developer. Have a keen interest in tech, RPG games, and good stories.🤖",
  avatarUrl:
    "https://avatars.githubusercontent.com/u/15965200?s=400&u=f240353cd552d7409e345f8d367046014c99161b&v=4",
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
      school: "CEP CCIT University of Indonesia",
      degree: "Associate Degree in Information Engineering, GPA: 3.7",
      start: "2017",
      end: "2019",
      desc: "Prominent coursework: Web & Mobile App Development, Databases, Object-oriented Programming, DevOps. Developed 24 applications for monthly project using various programming languages, frameworks and APIs.",
    },
  ],
  work: [
    {
      company: "Icon Plus",
      link: "https://plniconplus.co.id/",
      badges: "/images/iconpln.png",
      title: "Web Software Developer",
      logo: "",
      start: "2022",
      end: "Now",
      description:
        "Working on several web products by delivering new major features.",
    },
    {
      company: "Cipta Kreasi",
      link: "#",
      badges: "/images/cipta_kreasi.png",
      title: "Front-End Developer",
      logo: "",
      start: "2020",
      end: "2022",
      description:
        "Designed and developed SEO-optimized landing pages.",
    },
    {
      company: "Tebuireng Telecom",
      link: "#",
      badges: "",
      title: "Junior Front-End Developer",
      logo: "",
      start: "2019",
      end: "2020",
      description: "Assisted in developing web components and API-integration.",
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
      techStack: ["Main Project", "Vue", "NodeJS", "Spring Boot"],
      description:
        "Simplify tax calculation, reporting, and payment processes.",
      logo: "",
      link: {
        label: "air-tax",
        href: "https://web-blue.air.id/airtax-new",
      },
      img: "/images/airtax.webp",
      isFeatured: true,
    },
    {
      title: "cheSKP",
      techStack: ["Main Project", "Vue", "NodeJS", "Spring Boot", "Kotlin"],
      description:
        "Conducting and analyzing customer satisfaction surveys seamlessly.",
      logo: "",
      link: {
        label: "cheskp",
        href: "https://cheskp-mobile.pln.co.id/",
      },
      img: "/images/cheskp.webp",
      isFeatured: true,
    },
    {
      title: "Virtual Cubicle",
      techStack: ["Main Project", "Vue", "NodeJS", "Tailwind"],
      description:
        "Web platform to digitalize and streamline core business operations of PLN Enjiniring.",
      logo: "",
      link: {
        label: "vc",
        href: "https://newvcubicle.plne.co.id",
      },
      img: "/images/vc.webp",
      isFeatured: false,
    },
    {
      title: "ESDS",
      techStack: ["Main Project", "Vue", "NodeJS", "Kotlin"],
      description:
        "Digital platform to facilitate electric stove data distribution.",
      logo: "",
      link: {
        label: "vc",
        href: "https://isds.pln.co.id",
      },
      img: "/images/esds.webp",
      isFeatured: false,
    },
    {
      title: "CheckMATE",
      techStack: ["Main Project", "Vue", "NodeJS", "Spring Boot"],
      description:
        "Web system for monitoring, analyzing, and evaluating the maturity levels of company units.",
      logo: "",
      img: "",
      isFeatured: false,
    },
    {
      title: "Skenatify",
      techStack: [
        "Side Project",
        "NextJS",
        "React",
        "Tailwind",
        "Typescript",
        "Spotify API",
      ],
      description:
        "Customized track recommendations based on your favorite artists.",
      logo: "",
      link: {
        label: "skenatify",
        href: "https://skenatify.vercel.app/",
      },
      img: "/images/skenatify.webp",
      isFeatured: false,
    },
    {
      title: "Kenali Caleg",
      techStack: ["Side Project", "React", "NextJS", "NodeJS", "Tailwind"],
      description:
        "Webpage to provide info on legislative candidates for the 2024 Indonesian Election.",
      logo: "",
      link: {
        label: "kenali-caleg",
        href: "https://kenali-caleg.vercel.app/",
      },
      img: "/images/kenali-caleg.webp",
      isFeatured: false,
    },
    {
      title: "datatech",
      techStack: ["Side Project", "AMP", "Bootstrap"],
      description: "Landing page for a software solutions company.",
      logo: "",
      link: {
        label: "datatech.id",
        href: "https://datatech.id/",
      },
      img: "/images/datatech.webp",
      isFeatured: true,
    },
    {
      title: "Englishseed",
      techStack: ["Side Project", "Wordpress", "PHP", "Google API"],
      description:
        "Online english learning class for kindergarten and elementary level.",
      logo: "",
      link: {
        label: "englishseed",
        href: "https://www.instagram.com/englishseed/",
      },
      img: "",
      isFeatured: false,
    },
    {
      title: "Sewagi",
      techStack: ["Laravel", "Bootstrap", "Elasticsearch", "Google API"],
      description: "User-friendly apartment management dashboard.",
      logo: "",
      link: {
        label: "sewagi-web",
        href: "https://sewagi-web.inspira.web.id",
      },
      img: "/images/sewagi.webp",
      isFeatured: true,
    },
    {
      title: "RRW",
      techStack: ["Main Project", "Java", "Laravel"],
      description: "A tool to assist SEO team in processing web reports.",
      logo: "",
      img: "",
      isFeatured: false,
    },
    {
      title: "Translight",
      techStack: ["Side Project", "Bootstrap"],
      description: "Landing page for a transportation company.",
      logo: "",
      img: "",
      isFeatured: false,
    },
    {
      title: "Tratus",
      techStack: ["Main Project", "Java", "SQLite"],
      description:
        " Mobile app to view information about tourist sites in West Java.",
      logo: "",
      img: "",
      isFeatured: false,
    },
  ],
} as const;
