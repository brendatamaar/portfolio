import { useState, useEffect } from 'react'
import { api } from '@/src/lib/api'
import type { PostSummary } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { BlogPostCard } from '@/components/ui/post-card'

export default function BlogPage() {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPosts()
      .then(setPosts)
      .catch((err) => console.error('Failed to fetch posts:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-3xl py-10 sm:py-16">
        <Header />

        <div className="mb-12">
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter text-black dark:text-white mb-4">
            Writing
          </h1>
          <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
            Occasional writing on what I'm learning.
          </p>
        </div>

        <div>
          {loading ? (
            <p className="py-8 font-mono text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
              loading...
            </p>
          ) : posts.length === 0 ? (
            <p className="py-8 font-mono text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
              Nothing yet — soon.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
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
