import type { ResumeData } from '@/src/lib/api'

export default function Hero({ data }: { data: ResumeData }) {
  const profile = data.profile

  if (!profile) return null

  return (
    <section className="mb-20">
      {/* name + info card */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <h1 className="flex-1 text-4xl leading-[0.92] font-black tracking-tighter text-black uppercase sm:text-5xl lg:text-6xl dark:text-white">
          {profile.name}
        </h1>

        {/* info card */}
        <div className="shrink-0 self-start border-2 border-black shadow-[4px_4px_0px_#000] sm:w-44 dark:border-white dark:shadow-[4px_4px_0px_#fff]">
          <div className="border-b-2 border-black px-4 py-3 dark:border-white">
            <p className="mb-1 font-mono text-[9px] font-bold tracking-widest text-black/60 uppercase dark:text-white/60">
              Role
            </p>
            <p className="text-xs font-black tracking-tight text-black uppercase dark:text-white">
              {profile.currentJob}
            </p>
          </div>
          <div className="border-b-2 border-black px-4 py-3 dark:border-white">
            <p className="mb-1 font-mono text-[9px] font-bold tracking-widest text-black/60 uppercase dark:text-white/60">
              Location
            </p>
            <p className="text-xs font-black tracking-tight text-black uppercase dark:text-white">
              {profile.location}
            </p>
          </div>
          <div className="px-4 py-3">
            <a
              href="/pdf/Resume Brendatama Akbar (2026) - English.pdf"
              download
              className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-widest text-black uppercase transition-colors hover:text-[#FFE600] dark:text-white dark:hover:text-[#FFE600]"
            >
              ↓ Resume
            </a>
          </div>
        </div>
      </div>

      {/* description */}
      <div className="border-t-2 border-black pt-6 dark:border-white">
        <p className="text-base leading-relaxed text-black/60 dark:text-white/60">
          {profile.summary}
        </p>
      </div>
    </section>
  )
}
