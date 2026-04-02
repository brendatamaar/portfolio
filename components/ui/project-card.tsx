import { memo } from 'react'
import { ArrowUpRightIcon } from 'lucide-react'
import { RESUME_DATA } from '@/data/resume-data'
import { MAX_TECH_TAGS } from '@/lib/constants'

type Project = (typeof RESUME_DATA.projects)[number]
type ProjectWithLink = Project & { link: { href: string } }

/** Memoized project card. Wrapped in an <a> only when the project has a link. */
export const ProjectCard = memo(function ProjectCard({
  project,
  index,
}: {
  project: Project
  index: number
}) {
  const hasLink = 'link' in project
  // First techStack entry is the project type ("work" | "personal" | …); rest are tech tags.
  const type = project.techStack[0]
  const tech = project.techStack.slice(1)
  const color = type === 'work' ? 'bg-blue-500' : 'bg-orange-500'
  const num = String(index + 1).padStart(2, '0')

  const content = (
    <div className="group flex h-full flex-col border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000] transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0px_#000] dark:border-white dark:bg-black dark:shadow-[4px_4px_0px_#fff] dark:hover:shadow-[6px_6px_0px_#fff]">
      <div className="mb-5 flex items-center justify-between">
        <span
          className={`${color} inline-flex items-center border-2 border-black px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]`}
        >
          {type}
        </span>
        <span className="font-mono text-[11px] font-bold text-black/25 dark:text-white/25">
          {num}
        </span>
      </div>

      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-xl leading-tight font-black tracking-tight text-black uppercase decoration-2 underline-offset-4 group-hover:underline dark:text-white">
          {project.title}
        </h3>
        <ArrowUpRightIcon
          className={`mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
            hasLink
              ? 'text-black dark:text-white'
              : 'text-black/20 dark:text-white/20'
          }`}
        />
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed font-medium text-black/60 dark:text-white/60">
        {project.description}
      </p>

      {tech.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {tech.slice(0, MAX_TECH_TAGS).map((t) => (
            <span
              key={t}
              className="inline-flex items-center border-2 border-black bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-black dark:text-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  if (hasLink) {
    return (
      <a
        href={(project as ProjectWithLink).link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {content}
      </a>
    )
  }

  return <div className="h-full">{content}</div>
})
