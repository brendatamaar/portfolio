import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from 'lucide-react'
import type { PostSummary } from '@/src/lib/api'
import { formatDate } from '@/components/util/formatDate'

export const BlogPostCard = memo(function BlogPostCard({
  post,
}: {
  post: PostSummary
}) {
  const date = post.publishedAt
    ? new Date(post.publishedAt * 1000)
    : new Date(post.createdAt * 1000)

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_#000] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_#fff] dark:hover:shadow-[6px_6px_0px_#fff]"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <span className="font-mono text-[11px] font-bold text-black/40 tabular-nums dark:text-white/40">
          {formatDate(date)}
        </span>
        <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-black transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-white" />
      </div>
      <h3 className="mb-2 text-xl font-black tracking-tight text-black uppercase decoration-2 underline-offset-4 group-hover:underline dark:text-white">
        {post.title}
      </h3>
      {post.description && (
        <p className="line-clamp-2 text-sm leading-relaxed font-medium text-black/60 dark:text-white/60">
          {post.description}
        </p>
      )}
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
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
    </Link>
  )
})
