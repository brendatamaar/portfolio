import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBlogPost } from '@/contentful/blogPosts'
import type { BlogPost as BlogPostType } from '@/contentful/blogPosts'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import RichText from '@/contentful/RichText'

function formatShortDate(dateString: string): string {
  const d = new Date(dateString)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${mm}.${dd}.${yy}`
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPostType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    async function load() {
      try {
        const result = await fetchBlogPost({ slug: slug!, preview: false })
        if (!result) {
          setNotFound(true)
        } else {
          setPost(result)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
          <Header />
          <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
            loading...
          </p>
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
          <Header />
          <p className="mb-4 font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
            post not found.
          </p>
          <Link
            to="/blog"
            className="link-underline font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-100"
          >
            ← back to writing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
        <Header />

        <Link
          to="/blog"
          className="link-underline mb-10 inline-block font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-100"
        >
          ← back to writing
        </Link>

        <div className="mb-8 border-b border-dashed border-zinc-200 pb-6 dark:border-zinc-800">
          <h1 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
              {formatShortDate(post.date)}
            </span>

            {post.tags.length > 0 && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-400 dark:text-zinc-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {post.desc && (
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {post.desc}
            </p>
          )}
        </div>

        <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-zinc-900 prose-a:underline-offset-2 dark:prose-a:text-zinc-100 prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-hr:border-dashed prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800">
          <RichText document={post.body} />
        </div>

        <div className="mt-12 border-t border-dashed border-zinc-200 pt-6 dark:border-zinc-800">
          <Link
            to="/blog"
            className="link-underline font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-100"
          >
            ← back to writing
          </Link>
        </div>

        <Footer />
      </div>
    </div>
  )
}
