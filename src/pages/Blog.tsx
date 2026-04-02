import { useState, useEffect, useMemo } from 'react'
import { api } from '@/src/lib/api'
import type { PostSummary } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { BlogPostCard } from '@/components/ui/post-card'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { TagButton } from '@/components/ui/tag-button'

export default function BlogPage() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    api
      .getPosts()
      .then(setPosts)
      .catch((err) => console.error('Failed to fetch posts:', err))
      .finally(() => setLoading(false))
  }, [])

  // Build a deduplicated tag list and a slug→name lookup in one pass.
  // Both are stable as long as `posts` doesn't change.
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
            Writing
          </h1>
          <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
            Occasional writing on what I'm learning.
          </p>
        </div>

        {allTagSlugs.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <TagButton
              label="all"
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
              Nothing yet — soon.
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
