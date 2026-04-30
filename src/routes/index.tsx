import { createFileRoute, Link } from '@tanstack/react-router'
import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  lazy,
  Suspense,
} from 'react'
import { ErrorBoundary } from '@/src/components/ui/error-boundary'
import { api } from '@/src/lib/api'
import type {
  PostSummary,
  BookItem,
  AlbumItem,
  ResumeData,
} from '@/src/lib/api'

import Hero from '@/components/section/Hero'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { BlogPostCard } from '@/components/ui/cards/post-card'
import { FeaturedCard } from '@/components/ui/cards/featured-card'
const Magnetic = lazy(() =>
  import('@/components/ui/interactive/magnetic').then((m) => ({
    default: m.Magnetic,
  })),
)
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDownIcon } from 'lucide-react'
import { SkeletonCard } from '@/components/ui/cards/skeleton-card'
import { Reveal } from '@/components/ui/text/reveal'
import { SectionLabel } from '@/components/ui/layout/section-label'
import { ProjectCard } from '@/components/ui/cards/project-card'
import { PROJECT_PREVIEW_COUNT, BLOG_POSTS_PREVIEW } from '@/src/lib/constants'
import { useLang } from '@/src/context/LanguageContext'

const SITE_NAME = 'Brendatama Akbar - Web Software Developer'

const EMPTY_RESUME: ResumeData = {
  profile: null,
  work: [],
  education: [],
  skills: [],
  projects: [],
}

export const Route = createFileRoute('/')({
  loader: async () => {
    const [postsRes, bookRes, albumRes, resumeEnRes, resumeIdRes] =
      await Promise.allSettled([
        api.getPosts('en').then((r) => r.data.slice(0, BLOG_POSTS_PREVIEW)),
        api.getFeaturedBook(),
        api.getFeaturedAlbum(),
        api.getResumeData('en'),
        api.getResumeData('id'),
      ])
    return {
      posts: postsRes.status === 'fulfilled' ? postsRes.value : [],
      book: bookRes.status === 'fulfilled' ? bookRes.value : null,
      album: albumRes.status === 'fulfilled' ? albumRes.value : null,
      resumeEn:
        resumeEnRes.status === 'fulfilled' ? resumeEnRes.value : EMPTY_RESUME,
      resumeId:
        resumeIdRes.status === 'fulfilled' ? resumeIdRes.value : EMPTY_RESUME,
    }
  },
  head: () => ({
    meta: [
      { title: SITE_NAME },
      {
        name: 'description',
        content: 'Brendatama Akbar - Web Software Developer',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: SITE_NAME },
      {
        property: 'og:description',
        content: 'Brendatama Akbar - Web Software Developer',
      },
      { property: 'og:url', content: 'https://www.brendatama.dev' },
      { property: 'og:site_name', content: SITE_NAME },
      { name: 'twitter:title', content: SITE_NAME },
      {
        name: 'twitter:description',
        content: 'Brendatama Akbar - Web Software Developer',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const {
    posts: initialPosts,
    book: featuredBook,
    album: featuredAlbum,
    resumeEn,
    resumeId,
  } = Route.useLoaderData()
  const { lang, t } = useLang()
  const data: ResumeData = lang === 'id' ? resumeId : resumeEn

  const [showAllProjects, setShowAllProjects] = useState(false)
  const [expandedWork, setExpandedWork] = useState<Record<string, boolean>>({})
  const [blogPosts, setBlogPosts] = useState<PostSummary[]>(initialPosts)
  const [isLoading, setIsLoading] = useState(false)

  const sideProjects = useMemo(
    () => data.projects.filter((p) => p.type === 'side_project'),
    [data.projects],
  )
  const workProjectsByCompany = useMemo(() => {
    const map: Record<string, (typeof data.projects)[number][]> = {}
    for (const p of data.projects) {
      if (p.type === 'work' && p.company) {
        const key = p.company
        if (!map[key]) map[key] = []
        map[key].push(p)
      }
    }
    return map
  }, [data.projects])

  const toggleWork = useCallback((company: string) => {
    setExpandedWork((prev) => ({ ...prev, [company]: !prev[company] }))
  }, [])

  const visibleProjects = showAllProjects
    ? sideProjects
    : sideProjects.slice(0, PROJECT_PREVIEW_COUNT)
  const remaining = sideProjects.length - PROJECT_PREVIEW_COUNT

  // Re-fetch posts when lang changes client-side
  useEffect(() => {
    setIsLoading(true)
    api
      .getPosts(lang)
      .then((r) => setBlogPosts(r.data.slice(0, BLOG_POSTS_PREVIEW)))
      .catch((err) => console.error('Error loading blog posts:', err))
      .finally(() => setIsLoading(false))
  }, [lang])

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />
        <Hero data={data} />

        <main id="main" className="space-y-20">
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
                {data.work.map((work, i) => {
                  const companyProjects = workProjectsByCompany[work.company]
                  const isExpanded = expandedWork[work.company]

                  return (
                    <div
                      key={work.company}
                      className={
                        i < data.work.length - 1
                          ? 'border-b-2 border-black dark:border-white'
                          : ''
                      }
                    >
                      <div className="flex items-start justify-between gap-6 py-5">
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
                          {companyProjects && (
                            <button
                              onClick={() => toggleWork(work.company)}
                              className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] font-bold tracking-widest text-black/50 uppercase transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
                            >
                              {isExpanded ? 'hide projects' : 'see projects'}
                              <ChevronDownIcon
                                className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-black/50 tabular-nums dark:text-white/50">
                          {work.start}–{work.end}
                        </span>
                      </div>

                      <AnimatePresence initial={false}>
                        {companyProjects && isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 items-stretch gap-4 pb-5 sm:grid-cols-2">
                              {companyProjects.map((project, j) => (
                                <ProjectCard
                                  key={project.title}
                                  project={project}
                                  index={j}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
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
          {/* <Reveal delay={0.05}>
            <section>
              <SectionLabel num="04" label={t('sections.reading')} />
              {featuredBook ? (
                <>
                  <FeaturedCard type="book" item={featuredBook as BookItem} />
                  <Link
                    to="/collection"
                    hash="books"
                    className="mt-6 inline-block border-2 border-black px-5 py-2.5 font-mono text-xs tracking-widest text-black uppercase shadow-[4px_4px_0px_#000] transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:shadow-[4px_4px_0px_#fff] dark:hover:bg-white dark:hover:text-black"
                  >
                    {t('collection.seeAll')}
                  </Link>
                </>
              ) : (
                <p className="py-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
                  {t('collection.empty')}
                </p>
              )}
            </section>
          </Reveal> */}

          {/* 05 — Listening */}
          {/* <Reveal delay={0.05}>
            <section>
              <SectionLabel num="05" label={t('sections.listening')} />
              {featuredAlbum ? (
                <>
                  <FeaturedCard
                    type="album"
                    item={featuredAlbum as AlbumItem}
                  />
                  <Link
                    to="/collection"
                    hash="albums"
                    className="mt-6 inline-block border-2 border-black px-5 py-2.5 font-mono text-xs tracking-widest text-black uppercase shadow-[4px_4px_0px_#000] transition-colors hover:bg-black hover:text-white dark:border-white dark:text-white dark:shadow-[4px_4px_0px_#fff] dark:hover:bg-white dark:hover:text-black"
                  >
                    {t('collection.seeAll')}
                  </Link>
                </>
              ) : (
                <p className="py-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
                  {t('collection.empty')}
                </p>
              )}
            </section>
          </Reveal> */}

          {/* 06 — Connect */}
          <Reveal delay={0.05}>
            <section>
              <SectionLabel num="06" label={t('sections.connect')} />
              <p className="mb-8 text-base leading-relaxed text-black/60 dark:text-white/60">
                {t('home.connect')}
              </p>
              <div className="flex flex-wrap gap-3">
                <ErrorBoundary fallback={null}>
                  <Suspense fallback={null}>
                    {(data.profile?.social ?? []).map((link) => (
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
                  </Suspense>
                </ErrorBoundary>
              </div>
            </section>
          </Reveal>
        </main>

        <Footer />
      </div>
    </div>
  )
}
