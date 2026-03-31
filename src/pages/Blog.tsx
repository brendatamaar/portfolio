import { useState, useEffect } from 'react'
import { api } from '@/src/lib/api'
import type { PostSummary } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { BlogPostCard } from '@/components/ui/post-card'

function SkeletonCard() {
  return (
    <div className="border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-3 w-20 bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-4 bg-black/10 dark:bg-white/10" />
      </div>
      <div className="h-5 w-3/4 bg-black/10 dark:bg-white/10 mb-2" />
      <div className="h-4 w-full bg-black/10 dark:bg-white/10" />
      <div className="h-4 w-2/3 bg-black/10 dark:bg-white/10 mt-1" />
    </div>
  )
}

export default function BlogPage() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    api.getPosts()
      .then(setPosts)
      .catch((err) => console.error('Failed to fetch posts:', err))
      .finally(() => setLoading(false))
  }, [])

  const allTags = [...new Set(posts.flatMap(p => p.tags.map(t => t.slug)))]
  const visible = activeTag ? posts.filter(p => p.tags.some(t => t.slug === activeTag)) : posts

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />

        <div className="mb-12">
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter text-black dark:text-white mb-4">
            Writing
          </h1>
          <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
            Occasional writing on what I'm learning.
          </p>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTag(null)}
              className={`inline-flex items-center px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-colors ${
                activeTag === null
                  ? 'bg-[#FFE600] text-black border-black dark:border-black'
                  : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#FFE600] dark:hover:text-black dark:hover:border-black'
              }`}
            >
              all
            </button>
            {allTags.map(slug => {
              const tag = posts.flatMap(p => p.tags).find(t => t.slug === slug)
              return (
                <button
                  key={slug}
                  onClick={() => setActiveTag(slug === activeTag ? null : slug)}
                  className={`inline-flex items-center px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-colors ${
                    activeTag === slug
                      ? 'bg-[#FFE600] text-black border-black dark:border-black'
                      : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#FFE600] hover:text-black dark:hover:bg-[#FFE600] dark:hover:text-black dark:hover:border-black'
                  }`}
                >
                  #{tag?.name ?? slug}
                </button>
              )
            })}
          </div>
        )}

        <div>
          {loading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : visible.length === 0 ? (
            <p className="py-8 font-mono text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
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
