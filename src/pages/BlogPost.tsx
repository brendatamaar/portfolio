import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '@/src/lib/api'
import type { PostDetail } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import MarkdownRenderer from '@/src/components/blog/MarkdownRenderer'
import { formatDate } from '@/components/util/formatDate'
import { ScrollProgress } from '@/components/ui/scroll-progress'

/** Estimate reading time in minutes (200 wpm, minimum 1). */
function readingTime(html: string) {
  const text = html.replace(/<[^>]+>/g, '')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

/** Floating button that appears after scrolling 400px down. */
function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed right-6 bottom-6 z-50 border-2 border-black bg-white px-4 py-2 font-mono text-xs tracking-widest text-black uppercase shadow-[4px_4px_0px_#000] transition-colors hover:border-black hover:bg-[#FFE600] dark:border-white dark:bg-black dark:text-white dark:shadow-[4px_4px_0px_#fff] dark:hover:border-[#FFE600] dark:hover:bg-[#FFE600] dark:hover:text-black"
        >
          ↑ top
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    api
      .getPost(slug)
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
          <Header />
          <p className="font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
            loading...
          </p>
        </div>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
          <Header />
          <p className="mb-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Post not found.
          </p>
          <Link
            to="/blog"
            className="font-mono text-[11px] tracking-widest text-black uppercase hover:underline dark:text-white"
          >
            ← back to writing
          </Link>
        </div>
      </div>
    )
  }

  const { post, html, toc, sidenotes } = data
  // Server stores timestamps as Unix seconds; prefer publishedAt if available.
  const date = new Date((post.publishedAt ?? post.createdAt) * 1000)

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <ScrollProgress className="fixed z-50 border-b-2 border-black bg-[#FFE600] dark:border-white" />
      <BackToTop />

      {/* Narrow header / post meta zone */}
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />

        <div className="mb-10 border-b-2 border-black pb-10 dark:border-white">
          <Link
            to="/blog"
            className="mb-8 inline-block font-mono text-[11px] font-bold tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            ← writing
          </Link>

          {post.tags.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-flex items-center border-2 border-black bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:text-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          <h1 className="mb-4 text-5xl leading-[0.9] font-black tracking-tighter text-black uppercase sm:text-6xl dark:text-white">
            {post.title}
          </h1>

          {post.description && (
            <p className="mb-8 max-w-2xl text-xl leading-relaxed text-black/60 dark:text-white/60">
              {post.description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] font-bold tracking-widest text-black/30 uppercase dark:text-white/30">
              {formatDate(date)}
            </span>
            <span className="font-mono text-[11px] text-black/40 dark:text-white/40">
              ·
            </span>
            <span className="font-mono text-[11px] text-black/40 dark:text-white/40">
              {readingTime(html)} min read
            </span>
          </div>
        </div>
      </div>

      {/* 3-column article layout — wider than max-w-3xl to fit sidenotes + TOC */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: '72rem' }}>
        <MarkdownRenderer html={html} toc={toc} sidenotes={sidenotes} />
      </div>

      {/* Narrow footer zone */}
      <div className="mx-auto max-w-3xl px-6 pb-16">
        <div className="flex items-center justify-between border-t-2 border-black pt-6 dark:border-white">
          <Link
            to="/blog"
            className="font-mono text-[11px] font-bold tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            ← all posts
          </Link>
        </div>
        <Footer />
      </div>
    </div>
  )
}
