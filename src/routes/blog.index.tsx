import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { api } from '@/src/lib/api'
import type { PostSummary } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { BlogPostCard } from '@/components/ui/post-card'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { TagButton } from '@/components/ui/tag-button'
import { useLang } from '@/src/context/LanguageContext'

export const Route = createFileRoute('/blog/')({
  loader: () => api.getPosts('en'),
  head: () => ({
    meta: [
      { title: 'Writing | Brendatama Akbar' },
      {
        name: 'description',
        content: 'Writing on software, design, and the web.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Writing | Brendatama Akbar' },
      {
        property: 'og:description',
        content: 'Writing on software, design, and the web.',
      },
      { property: 'og:url', content: 'https://www.brendatama.xyz/blog' },
      { name: 'twitter:title', content: 'Writing | Brendatama Akbar' },
      {
        name: 'twitter:description',
        content: 'Writing on software, design, and the web.',
      },
    ],
  }),
  component: BlogPage,
})

function BlogPage() {
  const initialPosts = Route.useLoaderData()
  const { lang, t } = useLang()
  const [posts, setPosts] = useState<PostSummary[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Re-fetch when lang changes client-side
  useEffect(() => {
    setLoading(true)
    api
      .getPosts(lang)
      .then(setPosts)
      .catch((err) => console.error('Failed to fetch posts:', err))
      .finally(() => setLoading(false))
  }, [lang])

  const { allTagSlugs, tagNames } = useMemo(() => {
    const names: Record<string, string> = {}
    const seen = new Set<string>()
    const slugs: string[] = []
    for (const post of posts) {
      for (const tag of post.tags) {
        names[tag.slug] = tag.name
        if (!seen.has(tag.slug)) {
          seen.add(tag.slug)
          slugs.push(tag.slug)
        }
      }
    }
    return { allTagSlugs: slugs, tagNames: names }
  }, [posts])

  const visible = useMemo(
    () =>
      activeTag
        ? posts.filter((p) => p.tags.some((t) => t.slug === activeTag))
        : posts,
    [posts, activeTag],
  )

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />

        <div className="mb-12">
          <h1 className="mb-4 text-5xl font-black tracking-tighter text-black uppercase sm:text-7xl dark:text-white">
            {t('blog.heading')}
          </h1>
          <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
            {t('blog.subtitle')}
          </p>
        </div>

        {allTagSlugs.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <TagButton
              label={t('blog.all')}
              active={activeTag === null}
              onClick={() => setActiveTag(null)}
            />
            {allTagSlugs.map((slug) => (
              <TagButton
                key={slug}
                label={`#${tagNames[slug] ?? slug}`}
                active={activeTag === slug}
                onClick={() => setActiveTag(slug === activeTag ? null : slug)}
              />
            ))}
          </div>
        )}

        <div>
          {loading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="py-8 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
              {t('blog.empty')}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {visible.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
