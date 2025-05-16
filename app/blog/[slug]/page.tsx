import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { fetchBlogPost, fetchBlogPosts } from '@/contentful/blogPosts'
import { formatDate } from '@/components/util/formatDate'
import Link from 'next/link'
import RichText from '@/contentful/RichText'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'

interface BlogPostPageParams {
  slug: string
}

interface BlogPostPageProps {
  params: Promise<{ [key: string]: string }>
}

export async function generateStaticParams(): Promise<BlogPostPageParams[]> {
  const blogPosts = await fetchBlogPosts({ preview: false })

  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params)

  const blogPost = await fetchBlogPost({
    slug: resolvedParams.slug,
    preview: (await draftMode()).isEnabled,
  })

  if (!blogPost) {
    return notFound()
  }

  return {
    title: blogPost.title,
    description: blogPost.title,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await Promise.resolve(params)

  const blogPost = await fetchBlogPost({
    slug: resolvedParams.slug,
    preview: (await draftMode()).isEnabled,
  })

  if (!blogPost) {
    return notFound()
  }

  return (
    <div className="flex min-h-screen w-full flex-col font-[family-name:var(--font-inter-tight)]">
      <div className="relative mx-auto w-full max-w-screen-sm flex-1 px-4 pt-14">
        <Header />
        <div className="border-t border-b pt-4 pb-4">
          <Link className="text-sm" href="/blog">
            ← Back
          </Link>
          <h1 className="mt-4 text-2xl">{blogPost.title}</h1>
          <span className="text-xs text-zinc-600 dark:text-zinc-500">
            {formatDate(blogPost.date)}
          </span>

          <RichText document={blogPost.body} />
        </div>
        <div className="mt-4 inline-flex gap-x-2">
          {blogPost.tags.map((tag) => (
            <span key={tag} className="text-zinc-600 dark:text-zinc-400">
              #{tag}
            </span>
          ))}
        </div>

        <Footer />
      </div>
    </div>
  )
}
