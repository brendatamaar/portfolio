import '@/src/styles/blog.css'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { ShareButtonProps } from './blog.$slug.types'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Share2, Link2, Twitter, Linkedin, Facebook } from 'lucide-react'
import { api } from '@/src/lib/api'
import type { PostDetail } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import MarkdownRenderer from '@/src/components/blog/MarkdownRenderer'
import { formatDate } from '@/components/util/formatDate'
import { ScrollProgress } from '@/components/ui/layout/scroll-progress'
import { BackToTop } from '@/components/ui/layout/back-to-top'
import { READING_WPM, HTML_TAG_REGEX } from '@/src/lib/constants'
import { useLang } from '@/src/context/LanguageContext'

function ShareButton({ title }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // Guard for SSR — window not available on server
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => {
    if (!open) return
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const copyLink = async () => {
    // window.location.href moved into handler — safe for SSR
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }

  const openWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const shareNative = async () => {
    try {
      await navigator.share({ title, url: window.location.href })
    } catch (err) {
      // User cancelled or share failed — safe to ignore
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('Share failed:', err)
      }
    }
    setOpen(false)
  }

  const itemClass =
    'flex w-full items-center gap-2 px-3 py-2 font-mono text-[10px] font-bold tracking-wide uppercase text-black transition-colors hover:bg-[#FFE600] dark:text-white dark:hover:bg-[#FFE600] dark:hover:text-black'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        aria-label="Share post"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Share2 size={12} />
        {copied ? 'COPIED!' : 'SHARE'}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Share options"
          className="absolute top-full left-0 z-50 mt-2 min-w-[168px] border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        >
          <button role="menuitem" onClick={copyLink} className={itemClass}>
            <Link2 size={11} /> COPY LINK
          </button>
          <button
            role="menuitem"
            onClick={() => {
              const url = window.location.href
              openWindow(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
              )
            }}
            className={itemClass}
          >
            <Twitter size={11} /> TWITTER
          </button>
          <button
            role="menuitem"
            onClick={() => {
              const url = window.location.href
              openWindow(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
              )
            }}
            className={itemClass}
          >
            <Linkedin size={11} /> LINKEDIN
          </button>
          <button
            role="menuitem"
            onClick={() => {
              const url = window.location.href
              openWindow(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
              )
            }}
            className={itemClass}
          >
            <Facebook size={11} /> FACEBOOK
          </button>
          {hasNativeShare && (
            <button role="menuitem" onClick={shareNative} className={itemClass}>
              <Share2 size={11} /> MORE
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function readingTime(html: string) {
  const text = html.replace(HTML_TAG_REGEX, '')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / READING_WPM))
}

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    return await api.getPost(params.slug, 'en')
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { post } = loaderData as PostDetail
    const title = `${post.title} | Brendatama Akbar`
    const description = post.description ?? 'Read on brendatama.xyz'
    const url = `https://www.brendatama.xyz/blog/${post.slug}`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
    }
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const initialData = Route.useLoaderData() as PostDetail | null
  const { lang, t } = useLang()

  const [data, setData] = useState<PostDetail | null>(initialData)
  const [loading, setLoading] = useState(false)
  const mins = useMemo(() => (data ? readingTime(data.html) : 0), [data])

  // Re-fetch when lang changes client-side — AbortController prevents stale responses
  useEffect(() => {
    if (!initialData) return
    if (lang === 'en') {
      setData(initialData)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    api
      .getPost(initialData.post.slug, lang, controller.signal)
      .then(setData)
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to load translated post:', err)
          setData(initialData)
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [lang, initialData])

  if (!data) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
          <Header />
          <p className="mb-4 font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
            {t('blog.notFound')}
          </p>
          <Link
            to="/blog"
            className="font-mono text-[11px] tracking-widest text-black uppercase hover:underline dark:text-white"
          >
            {t('blog.back')}
          </Link>
        </div>
      </div>
    )
  }

  const { post, html, toc, sidenotes } = data
  const date = new Date(post.publishedAt ?? post.createdAt)

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
          <Header />
          <p className="font-mono text-[11px] tracking-widest text-black/40 uppercase dark:text-white/40">
            {t('blog.loading')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <ScrollProgress className="fixed z-50 border-b-2 border-black bg-[#FFE600] dark:border-white" />
      <BackToTop />

      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <Header />

        <div className="mb-10 border-b-2 border-black pb-10 dark:border-white">
          <Link
            to="/blog"
            className="mb-8 inline-block font-mono text-[11px] font-bold tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            {t('blog.back')}
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
              {mins} {t('post.minRead')}
            </span>
            <span className="font-mono text-[11px] text-black/40 dark:text-white/40">
              ·
            </span>
            <ShareButton title={post.title} />
          </div>
        </div>
      </div>

      <main id="main" className="mx-auto max-w-[72rem] px-6 pb-16">
        <MarkdownRenderer html={html} toc={toc} sidenotes={sidenotes} />
      </main>

      <div className="mx-auto max-w-3xl px-6 pb-16">
        <div className="flex items-center justify-between border-t-2 border-black pt-6 dark:border-white">
          <Link
            to="/blog"
            className="font-mono text-[11px] font-bold tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            {t('blog.backAll')}
          </Link>
        </div>
        <Footer />
      </div>
    </div>
  )
}
