import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchBlogPosts } from '@/contentful/blogPosts'
import type { BlogPost } from '@/contentful/blogPosts'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'

function formatShortDate(dateString: string): string {
  const d = new Date(dateString)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${mm}.${dd}.${yy}`
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const posts = await fetchBlogPosts({ preview: false })
        setBlogPosts(posts)
      } catch (error) {
        console.error('Failed to fetch blog posts:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
        <Header />

        <div className="mb-10">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            writing
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            thinking out loud &mdash; on building things, design, and whatever else is on my mind.
          </p>
        </div>

        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800">
          {loading ? (
            <p className="py-8 font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
              loading...
            </p>
          ) : blogPosts.length === 0 ? (
            <p className="py-8 font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
              nothing yet &mdash; soon.
            </p>
          ) : (
            blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex items-start justify-between gap-4 border-b border-dashed border-zinc-200 py-5 transition-opacity duration-200 hover:opacity-60 dark:border-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {post.title}
                  </h2>
                  {post.desc && (
                    <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {post.desc}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-400 dark:text-zinc-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
                    {formatShortDate(post.date)}
                  </span>
                  <span className="-translate-x-1 text-zinc-400 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:text-zinc-600">
                    &rarr;
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
