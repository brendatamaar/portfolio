import '@/src/styles/blog.css'
import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Share2, Link2, Twitter, Linkedin, Facebook } from 'lucide-react'
import { api } from '@/src/lib/api'
import type { PostDetail } from '@/src/lib/api'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import MarkdownRenderer from '@/src/components/blog/MarkdownRenderer'
import { formatDate } from '@/components/util/formatDate'
import { ScrollProgress } from '@/components/ui/scroll-progress'
import { BackToTop } from '@/components/ui/back-to-top'
import { READING_WPM, HTML_TAG_REGEX } from '@/src/lib/constants'
import { useLang } from '@/src/context/LanguageContext'
import { useSEO } from '@/src/hooks/useSEO'

function ShareButton({ title }: { title: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const url = window.location.href
  const hasNativeShare = !!navigator.share

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
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
      await navigator.share({ title, url })
    } catch {
      /* cancelled */
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
      >
        <Share2 size={12} />
        {copied ? 'COPIED!' : 'SHARE'}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 min-w-[168px] border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <button onClick={copyLink} className={itemClass}>
            <Link2 size={11} /> COPY LINK
          </button>
          <button
            onClick={() =>
              openWindow(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
              )
            }
            className={itemClass}
          >
            <Twitter size={11} /> TWITTER
          </button>
          <button
            onClick={() =>
              openWindow(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
              )
            }
            className={itemClass}
          >
            <Linkedin size={11} /> LINKEDIN
          </button>
          <button
            onClick={() =>
              openWindow(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
              )
            }
            className={itemClass}
          >
            <Facebook size={11} /> FACEBOOK
          </button>
          {hasNativeShare && (
            <button onClick={shareNative} className={itemClass}>
              <Share2 size={11} /> MORE
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Estimate reading time in minutes (200 wpm, minimum 1). */
function readingTime(html: string) {
  const text = html.replace(HTML_TAG_REGEX, '')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / READING_WPM))
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { lang, t } = useLang()
  const [data, setData] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    api
      .getPost(slug, lang)
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug, lang])

  useSEO({
    title: data?.post.title,
    description: data?.post.description || undefined,
    url: data ? `/blog/${data.post.slug}` : undefined,
    type: 'article',
  })

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

  if (notFound || !data) {
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
              {readingTime(html)} {t('post.minRead')}
            </span>
            <span className="font-mono text-[11px] text-black/40 dark:text-white/40">
              ·
            </span>
            <ShareButton title={post.title} />
          </div>
        </div>
      </div>

      {/* 3-column article layout — wider than max-w-3xl to fit sidenotes + TOC */}
      <div className="mx-auto max-w-[72rem] px-6 pb-16">
        <MarkdownRenderer html={html} toc={toc} sidenotes={sidenotes} />
      </div>

      {/* Narrow footer zone */}
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
