import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from 'lucide-react'
import { fetchBlogPosts } from '@/contentful/blogPosts'
import type { BlogPost } from '@/contentful/blogPosts'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { formatDate } from '@/components/util/formatDate'


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
            <p className="py-8 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
              loading...
            </p>
          ) : blogPosts.length === 0 ? (
            <p className="py-8 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
              Nothing yet — soon.
            </p>
          ) : (
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
                  <h2 className="text-xl font-black uppercase tracking-tight text-black dark:text-white group-hover:underline decoration-2 underline-offset-4 mb-2">
                    {post.title}
                  </h2>
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
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
