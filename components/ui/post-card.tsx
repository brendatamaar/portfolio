import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from 'lucide-react'
import type { BlogPost } from '@/contentful/blogPosts'
import { formatDate } from '@/components/util/formatDate'

export const BlogPostCard = memo(function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block border-2 border-black dark:border-white bg-white dark:bg-black shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#fff] hover:-translate-x-px hover:-translate-y-px transition-all duration-150 p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="font-mono text-[11px] font-bold text-black/40 dark:text-white/40 tabular-nums">
          {formatDate(post.date)}
        </span>
        <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-black dark:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white group-hover:underline decoration-2 underline-offset-4 mb-2">
        {post.title}
      </h3>
      {post.desc && (
        <p className="text-sm font-medium text-black/60 dark:text-white/60 line-clamp-2 leading-relaxed">
          {post.desc}
        </p>
      )}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
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
    </Link>
  )
})
