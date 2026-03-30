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

function SectionHeading({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-dashed border-zinc-200 pb-3 dark:border-zinc-800">
      <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
        {num}
      </span>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
    </div>
  )
}

// project row

type Project = (typeof RESUME_DATA.projects)[number]

function ProjectRow({ project }: { project: Project }) {
  const hasLink = 'link' in project

  return (
    <div className="group flex items-baseline justify-between gap-4 border-b border-dashed border-zinc-200 py-3 dark:border-zinc-800">
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
          {project.techStack[0] === 'side project' ? '~' : '*'}
        </span>
        {hasLink ? (
          <a
            href={(project as { link: { href: string } }).link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline shrink-0 text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            {project.title}
            <ArrowUpRightIcon className="mb-0.5 ml-0.5 inline h-3 w-3 opacity-0 transition-all duration-150 group-hover:opacity-60 group-hover:translate-x-px group-hover:-translate-y-px" />
          </a>
        ) : (
          <span className="shrink-0 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {project.title}
          </span>
        )}
      </div>
      <p className="hidden truncate text-right text-sm text-zinc-500 dark:text-zinc-400 sm:block sm:max-w-xs lg:max-w-sm">
        {project.description}
      </p>
    </div>
  )
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
        <Header />
        <Hero />

        <main className="space-y-16">

          {/* projects */}
          <Reveal>
            <section>
              <SectionHeading num="01" label="projects" />
              <div>
                {visibleProjects.map((project) => (
                  <ProjectRow key={project.title} project={project} />
                ))}
              </div>
              {!showAllProjects && remaining > 0 && (
                <button
                  onClick={() => setShowAllProjects(true)}
                  className="link-underline mt-4 text-sm text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-100"
                >
                  see all {data.projects.length} projects &rarr;
                </button>
              )}
            </section>
          </Reveal>

          {/* work */}
          <Reveal delay={0.05}>
            <section>
              <SectionHeading num="02" label="work" />
              <div>
                {data.work.map((work) => (
                  <div
                    key={work.company}
                    className="flex items-baseline justify-between gap-4 border-b border-dashed border-zinc-200 py-3 dark:border-zinc-800"
                  >
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="shrink-0 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {work.company}
                      </span>
                      <span className="hidden truncate text-sm text-zinc-500 dark:text-zinc-400 sm:block">
                        {work.description}
                      </span>
                    </div>
                    <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
                      {work.start}&ndash;{work.end}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          {/* writing */}
          <Reveal delay={0.05}>
            <section>
              <SectionHeading num="03" label="writing" />
              <div>
                {isLoading ? (
                  <p className="py-3 font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
                    loading...
                  </p>
                ) : blogPosts.length > 0 ? (
                  blogPosts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="group flex items-baseline justify-between gap-4 border-b border-dashed border-zinc-200 py-3 dark:border-zinc-800"
                    >
                      <span className="link-underline text-sm text-zinc-900 dark:text-zinc-100">
                        {post.title}
                      </span>
                      <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: '2-digit',
                        })}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="py-3 font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
                    nothing yet &mdash; soon.
                  </p>
                )}
              </div>
            </section>
          </Reveal>

          {/* connect */}
          <Reveal delay={0.05}>
            <section>
              <SectionHeading num="04" label="connect" />
              <p className="mb-5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                If you need help in developing software, designing products, solving problems or
                building teams, or just to grab some coffee and have a good talk, please reach out via:
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {data.contact.social.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    {link.name}
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
