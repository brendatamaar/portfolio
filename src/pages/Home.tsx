import { memo, useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'motion/react'
import { ArrowUpRightIcon } from 'lucide-react'
import { api } from '@/src/lib/api'
import type { PostSummary } from '@/src/lib/api'

import Hero from '@/components/section/Hero'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { RESUME_DATA } from '@/data/resume-data'
import { BlogPostCard } from '@/components/ui/post-card'
import { Magnetic } from '@/components/ui/magnetic'

// --- Shared helpers ---

/** Fade-in + slide-up when the element scrolls into view. Triggers once. */
function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

/** Numbered section header with bottom border. */
function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-8 flex items-center gap-4 border-b-2 border-black pb-4 dark:border-white">
      <span className="font-mono text-[11px] text-black/40 dark:text-white/40">
        {num}
      </span>
      <h2 className="text-xs font-black tracking-widest text-black uppercase dark:text-white">
        {label}
      </h2>
    </div>
  )
}

// --- Project card ---

type Project = (typeof RESUME_DATA.projects)[number]

/** Memoized project card. Wrapped in an <a> only when the project has a link. */
const ProjectCard = memo(function ProjectCard({
  project,
  index,
}: {
  project: Project
  index: number
}) {
  const hasLink = 'link' in project
  // First techStack entry is the project type ("work" | "personal" | …); rest are tech tags.
  const type = project.techStack[0]
  const tech = project.techStack.slice(1)
  const color = type === 'work' ? 'bg-blue-500' : 'bg-orange-500'
  const num = String(index + 1).padStart(2, '0')

  const content = (
    <div className="group flex h-full flex-col border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_#000] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_#fff] dark:hover:shadow-[6px_6px_0px_#fff]">
      <div className="mb-5 flex items-center justify-between">
        <span
          className={`${color} inline-flex items-center border-2 border-black px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]`}
        >
          {type}
        </span>
        <span className="font-mono text-[11px] font-bold text-black/25 dark:text-white/25">
          {num}
        </span>
      </div>

      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-xl leading-tight font-black tracking-tight text-black uppercase decoration-2 underline-offset-4 group-hover:underline dark:text-white">
          {project.title}
        </h3>
        <ArrowUpRightIcon
          className={`mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
            hasLink
              ? 'text-black dark:text-white'
              : 'text-black/20 dark:text-white/20'
          }`}
        />
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed font-medium text-black/60 dark:text-white/60">
        {project.description}
      </p>

      {tech.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {tech.slice(0, 3).map((t) => (
            <span
              key={t}
              className="inline-flex items-center border-2 border-black bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:text-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  if (hasLink) {
    return (
      <a
        href={(project as { link: { href: string } }).link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {content}
      </a>
    )
  }

  return <div className="h-full">{content}</div>
})

/** Animated placeholder shown while blog posts are loading. */
function SkeletonCard() {
  return (
    <div className="animate-pulse border-2 border-black p-5 shadow-[4px_4px_0px_#000] dark:border-white dark:shadow-[4px_4px_0px_#fff]">
      <div className="mb-3 flex justify-between">
        <div className="h-3 w-20 bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-4 bg-black/10 dark:bg-white/10" />
      </div>
      <div className="mb-2 h-5 w-3/4 bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-full bg-black/10 dark:bg-white/10" />
      <div className="mt-1 h-4 w-2/3 bg-black/10 dark:bg-white/10" />
    </div>
  )
}

// --- Page ---

export default function Home() {
  const data = RESUME_DATA
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [blogPosts, setBlogPosts] = useState<PostSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const PREVIEW_COUNT = 4
  const visibleProjects = showAllProjects
    ? data.projects
    : data.projects.slice(0, PREVIEW_COUNT)
  const remaining = data.projects.length - PREVIEW_COUNT

  // Fetch only the 3 most recent posts for the Writing preview section.
  useEffect(() => {
    api
      .getPosts()
      .then((posts) => setBlogPosts(posts.slice(0, 3)))
      .catch((err) => console.error('Error loading blog posts:', err))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />
        <Hero />

        <main className="space-y-20">
          {/* 01 — Projects */}
          <Reveal>
            <section>
              <SectionLabel num="01" label="Projects" />
              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
                {visibleProjects.map((project, i) => (
                  <ProjectCard
                    key={project.title}
                    project={project}
                    index={i}
                  />
                ))}
              </div>
              {remaining > 0 && (
                <button
                  onClick={() => setShowAllProjects((prev) => !prev)}
                  className="mt-6 border-2 border-black px-5 py-2.5 font-mono text-xs tracking-widest text-black uppercase shadow-[4px_4px_0px_#000] transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:shadow-[4px_4px_0px_#fff] dark:hover:bg-white dark:hover:text-black"
                >
                  {showAllProjects
                    ? '− show less'
                    : `+ ${remaining} more projects`}
                </button>
              )}
            </section>
          </Reveal>

          {/* 02 — Work */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="02" label="Work" />
              <div>
                {data.work.map((work, i) => (
                  <div
                    key={work.company}
                    className={`flex items-start justify-between gap-6 py-5 ${
                      i < data.work.length - 1
                        ? 'border-b-2 border-black dark:border-white'
                        : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline gap-3">
                        <span className="text-sm font-black tracking-tight text-black uppercase dark:text-white">
                          {work.company}
                        </span>
                        <span className="font-mono text-[10px] font-bold tracking-widest text-black/40 uppercase dark:text-white/40">
                          {work.title}
                        </span>
                      </div>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        {work.description}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-black/50 tabular-nums dark:text-white/50">
                      {work.start}–{work.end}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* 03 — Writing */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="03" label="Writing" />
              <div>
                {isLoading ? (
                  <div className="flex flex-col gap-4">
                    {[0, 1, 2].map((i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : blogPosts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {blogPosts.map((post) => (
                      <BlogPostCard key={post.slug} post={post} />
                    ))}
                  </div>
                ) : (
                  <p className="py-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
                    Nothing yet — soon.
                  </p>
                )}
              </div>
            </section>
          </Reveal>

          {/* 04 — Connect */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="04" label="Connect" />
              <p className="mb-8 text-base leading-relaxed text-black/60 dark:text-white/60">
                If you need help building software, designing products, or just
                want to grab coffee and talk — reach out.
              </p>
              <div className="flex flex-wrap gap-3">
                {data.contact.social.map((link) => (
                  <Magnetic key={link.name} intensity={0.4} range={80}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-2 border-black px-5 py-2.5 font-mono text-xs tracking-widest text-black uppercase shadow-[4px_4px_0px_#000] transition-colors hover:border-black hover:bg-[#FFE600] dark:border-white dark:text-white dark:shadow-[4px_4px_0px_#fff] dark:hover:border-[#FFE600] dark:hover:bg-[#FFE600] dark:hover:text-black"
                    >
                      {link.name} ↗
                    </a>
                  </Magnetic>
                ))}
              </div>
            </section>
          </Reveal>
        </main>

        <Footer />
      </div>
    </div>
  )
}
