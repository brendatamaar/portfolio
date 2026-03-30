import { motion, useInView } from 'motion/react'
import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from 'lucide-react'
import { fetchBlogPosts } from '@/contentful/blogPosts'
import type { BlogPost } from '@/contentful/blogPosts'

import Hero from '@/components/section/Hero'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { RESUME_DATA } from '@/data/resume-data'
import { formatDate } from '@/components/util/formatDate'

// helpers

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-8 flex items-center gap-4 border-b-2 border-black dark:border-white pb-4">
      <span className="font-[family-name:var(--font-mono)] text-[11px] text-black/40 dark:text-white/40">
        {num}
      </span>
      <h2 className="text-xs font-black uppercase tracking-widest text-black dark:text-white">
        {label}
      </h2>
    </div>
  )
}

// project card

type Project = (typeof RESUME_DATA.projects)[number]

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const hasLink = 'link' in project
  const type = project.techStack[0]
  const tech = project.techStack.slice(1)
  const color = type === 'work' ? 'bg-blue-500' : 'bg-orange-500'
  const num = String(index + 1).padStart(2, '0')

  const content = (
    <div className="group h-full border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#fff] hover:-translate-x-px hover:-translate-y-px transition-all duration-150 flex flex-col bg-white dark:bg-black p-5">

      {/* top row: type badge + number */}
      <div className="flex items-center justify-between mb-5">
        <span className={`${color} inline-flex items-center px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all`}>
          {type}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold text-black/25 dark:text-white/25">
          {num}
        </span>
      </div>

      {/* title + arrow */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white group-hover:underline decoration-2 underline-offset-4 leading-tight">
          {project.title}
        </h3>
        <ArrowUpRightIcon
          className={`mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
            hasLink ? 'text-black dark:text-white' : 'text-black/20 dark:text-white/20'
          }`}
        />
      </div>

      {/* description */}
      <p className="text-sm font-medium text-black/60 dark:text-white/60 line-clamp-2 leading-relaxed">
        {project.description}
      </p>

      {/* tech tags */}
      {tech.length > 0 && (
        <div className="mt-auto pt-5 flex flex-wrap gap-1.5">
          {tech.slice(0, 3).map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-wide text-black dark:text-white bg-white dark:bg-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all"
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
}

// main

export default function Home() {
  const data = RESUME_DATA
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const PREVIEW_COUNT = 4
  const visibleProjects = showAllProjects ? data.projects : data.projects.slice(0, PREVIEW_COUNT)
  const remaining = data.projects.length - PREVIEW_COUNT

  useEffect(() => {
    async function loadBlogPosts() {
      try {
        const posts = await fetchBlogPosts({ preview: false })
        setBlogPosts(posts)
      } catch (error) {
        console.error('Error loading blog posts:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadBlogPosts()
  }, [])

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-3xl py-10 sm:py-16">
        <Header />
        <Hero />

        <main className="space-y-20">

          {/* projects */}
          <Reveal>
            <section>
              <SectionLabel num="01" label="Projects" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                {visibleProjects.map((project, i) => (
                  <ProjectCard key={project.title} project={project} index={i} />
                ))}
              </div>
              {remaining > 0 && (
                <button
                  onClick={() => setShowAllProjects((prev) => !prev)}
                  className="mt-6 border-2 border-black dark:border-white px-5 py-2.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
                >
                  {showAllProjects ? '− show less' : `+ ${remaining} more projects`}
                </button>
              )}
            </section>
          </Reveal>

          {/* work */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="02" label="Work" />
              <div>
                {data.work.map((work, i) => (
                  <div
                    key={work.company}
                    className={`flex items-start justify-between gap-6 py-5 ${
                      i < data.work.length - 1 ? 'border-b-2 border-black dark:border-white' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-sm font-black uppercase tracking-tight text-black dark:text-white">
                          {work.company}
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                          {work.title}
                        </span>
                      </div>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        {work.description}
                      </p>
                    </div>
                    <span className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] text-black/50 dark:text-white/50 tabular-nums">
                      {work.start}–{work.end}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* writing */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="03" label="Writing" />
              <div>
                {isLoading ? (
                  <p className="py-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
                    loading...
                  </p>
                ) : blogPosts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {blogPosts.map((post) => (
                      <Link
                        key={post.slug}
                        to={`/blog/${post.slug}`}
                        className="group block border-2 border-black dark:border-white bg-white dark:bg-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#fff] hover:-translate-x-px hover:-translate-y-px transition-all duration-150 p-5"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold text-black/40 dark:text-white/40 tabular-nums">
                            {formatDate(post.date)}
                          </span>
                          <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-black dark:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white group-hover:underline decoration-2 underline-offset-4 mb-2">
                          {post.title}
                        </h3>
                        {post.desc && (
                          <p className="text-sm font-medium text-black/60 dark:text-white/60 line-clamp-2 leading-relaxed mb-3">
                            {post.desc}
                          </p>
                        )}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {post.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-wide text-black dark:text-white bg-white dark:bg-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
                    Nothing yet — soon.
                  </p>
                )}
              </div>
            </section>
          </Reveal>

          {/* connect */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="04" label="Connect" />
              <p className="text-base leading-relaxed text-black/60 dark:text-white/60 mb-8">
                If you need help building software, designing products, or just want to grab coffee
                and talk — reach out.
              </p>
              <div className="flex flex-wrap gap-3">
                {data.contact.social.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-black dark:border-white px-5 py-2.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-black dark:text-white hover:bg-[#FFE600] hover:border-black dark:hover:bg-[#FFE600] dark:hover:border-[#FFE600] dark:hover:text-black transition-colors shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff]"
                  >
                    {link.name} ↗
                  </a>
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
