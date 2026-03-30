import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBlogPost } from '@/contentful/blogPosts'
import type { BlogPost as BlogPostType } from '@/contentful/blogPosts'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import RichText from '@/contentful/RichText'
import { formatDate } from '@/components/util/formatDate'


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
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
          <Header />
          <p className="font-mono text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
            loading...
          </p>
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
          <Header />
          <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40">
            Post not found.
          </p>
          <Link
            to="/blog"
            className="font-mono text-[11px] uppercase tracking-widest text-black dark:text-white hover:underline"
          >
            ← back to writing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />

        {/* post header */}
        <div className="mb-16 pb-10 border-b-2 border-black dark:border-white">

          {/* back link */}
          <Link
            to="/blog"
            className="mb-8 inline-block font-mono text-[11px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          >
            ← writing
          </Link>

          {/* tags row */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-black dark:text-white bg-white dark:bg-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* title */}
          <h1 className="font-black text-5xl sm:text-6xl uppercase tracking-tighter leading-[0.9] text-black dark:text-white mb-4">
            {post.title}
          </h1>

          {/* description */}
          {post.desc && (
            <p className="text-xl leading-relaxed text-black/60 dark:text-white/60 max-w-2xl mb-8">
              {post.desc}
            </p>
          )}

          {/* date */}
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">
            {formatDate(post.date)}
          </span>
        </div>

        {/* article body */}
        <div>
          <RichText document={post.body} />
        </div>

        {/* footer nav */}
        <div className="mt-16 pt-6 border-t-2 border-black dark:border-white flex items-center justify-between">
          <Link
            to="/blog"
            className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          >
            ← all posts
          </Link>
        </div>

        <Footer />
      </div>
    </div>
  )
}
