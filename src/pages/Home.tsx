import { useState, useEffect } from 'react'
import { api } from '@/src/lib/api'
import type { PostSummary } from '@/src/lib/api'

import Hero from '@/components/section/Hero'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { RESUME_DATA } from '@/data/resume-data'
import { RESUME_DATA_ID } from '@/data/resume-data-id'
import { BlogPostCard } from '@/components/ui/post-card'
import { BookCard } from '@/components/ui/book-card'
import { Magnetic } from '@/components/ui/magnetic'
import { NowPlaying } from '@/components/ui/now-playing'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { Reveal } from '@/components/ui/reveal'
import { SectionLabel } from '@/components/ui/section-label'
import { ProjectCard } from '@/components/ui/project-card'
import { PROJECT_PREVIEW_COUNT, BLOG_POSTS_PREVIEW } from '@/src/lib/constants'
import { useLang } from '@/src/context/LanguageContext'

// --- Page ---

export default function Home() {
  const { lang, t } = useLang()
  const data = lang === 'id' ? RESUME_DATA_ID : RESUME_DATA

  const [showAllProjects, setShowAllProjects] = useState(false)
  const [blogPosts, setBlogPosts] = useState<PostSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const visibleProjects = showAllProjects
    ? data.projects
    : data.projects.slice(0, PROJECT_PREVIEW_COUNT)
  const remaining = data.projects.length - PROJECT_PREVIEW_COUNT

  // Fetch only the most recent posts for the Writing preview section.
  useEffect(() => {
    api
      .getPosts(lang)
      .then((posts) => setBlogPosts(posts.slice(0, BLOG_POSTS_PREVIEW)))
      .catch((err) => console.error('Error loading blog posts:', err))
      .finally(() => setIsLoading(false))
  }, [lang])

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />
        <Hero />

        <main className="space-y-20">
          {/* 01 — Projects */}
          <Reveal>
            <section>
              <SectionLabel num="01" label={t('sections.projects')} />
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
                    ? t('home.showLess')
                    : t('home.moreProjects', { n: remaining })}
                </button>
              )}
            </section>
          </Reveal>

          {/* 02 — Work */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="02" label={t('sections.work')} />
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
              <SectionLabel num="03" label={t('sections.writing')} />
              <div>
                {isLoading ? (
                  <div className="flex flex-col gap-4">
                    {Array.from({ length: BLOG_POSTS_PREVIEW }, (_, i) => (
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
                    {t('blog.empty')}
                  </p>
                )}
              </div>
            </section>
          </Reveal>

          {/* 04 — Reading */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="04" label={t('sections.reading')} />
              <div className="grid grid-cols-2 gap-4">
                {RESUME_DATA.books.map((book) => (
                  <BookCard key={book.title} book={book} />
                ))}
              </div>
            </section>
          </Reveal>

          {/* 05 — Listening */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="05" label={t('sections.listening')} />
              <NowPlaying />
            </section>
          </Reveal>

          {/* 06 — Connect */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="06" label={t('sections.connect')} />
              <p className="mb-8 text-base leading-relaxed text-black/60 dark:text-white/60">
                {t('home.connect')}
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
