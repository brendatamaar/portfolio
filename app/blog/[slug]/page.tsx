import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { fetchBlogPost, fetchBlogPosts } from '@/contentful/blogPosts'
import Link from 'next/link'
import RichText from '@/contentful/RichText'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { RESUME_DATA } from '@/data/resume-data'

interface BlogPostPageProps {
  params: Promise<{ [key: string]: string }>
}

function formatShortDate(dateString: string): string {
  const d = new Date(dateString)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(2)
  return `${mm}.${dd}.${yy}`
}

export async function generateStaticParams() {
  const blogPosts = await fetchBlogPosts({ preview: false })
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const blogPost = await fetchBlogPost({
    slug,
    preview: (await draftMode()).isEnabled,
  })

  if (!blogPost) return notFound()

  return {
    title: blogPost.title,
    description: blogPost.desc,
    openGraph: {
      title: blogPost.title,
      description: blogPost.desc,
      type: 'article',
      images: {
        url: `${RESUME_DATA.personalWebsiteUrl}images/preview.jpg`,
        width: 1200,
        height: 630,
        alt: `${RESUME_DATA.name} - Portfolio`,
      },
    },
    twitter: {
      card: 'summary_large_image',
      title: blogPost.title,
      description: blogPost.desc,
      images: {
        url: `${RESUME_DATA.personalWebsiteUrl}images/preview.jpg`,
        width: 1200,
        height: 630,
        alt: `${RESUME_DATA.name} - Portfolio`,
      },
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const blogPost = await fetchBlogPost({
    slug,
    preview: (await draftMode()).isEnabled,
  })

  if (!blogPost) return notFound()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
        <Header />

        {/* back link */}
        <Link
          href="/blog"
          className="link-underline mb-10 inline-block font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-100"
        >
          ← back to writing
        </Link>

        {/* post header */}
        <div className="mb-8 border-b border-dashed border-zinc-200 pb-6 dark:border-zinc-800">
          <h1 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {blogPost.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-zinc-400 dark:text-zinc-600">
              {formatShortDate(blogPost.date)}
            </span>

            {blogPost.tags.length > 0 && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <div className="flex flex-wrap gap-2">
                  {blogPost.tags.map((tag) => (
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

          {blogPost.desc && (
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {blogPost.desc}
            </p>
          )}
        </div>

        {/* prose content */}
        <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-zinc-900 prose-a:underline-offset-2 dark:prose-a:text-zinc-100 prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-hr:border-dashed prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800">
          <RichText document={blogPost.body} />
        </div>

        {/* bottom back link */}
        <div className="mt-12 border-t border-dashed border-zinc-200 pt-6 dark:border-zinc-800">
          <Link
            href="/blog"
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
