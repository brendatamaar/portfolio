import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Section } from '../../types/resume'
import { ProfileTab } from './ProfileTab'
import { WorkTab } from './WorkTab'
import { EducationTab } from './EducationTab'
import { SkillsTab } from './SkillsTab'
import { ProjectsTab } from './ProjectsTab'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'work', label: 'Work' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
]

export default function ResumeEditor() {
  const [section, setSection] = useState<Section>('profile')

  return (
    <div className="min-h-screen bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
      <header className="flex h-14 items-center justify-between border-b border-black/10 px-6 dark:border-white/10">
        <span className="text-sm font-black tracking-tight uppercase">
          Portfolio CMS
        </span>
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          ← Posts
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-3xl font-black tracking-tighter uppercase">
          Resume
        </h1>

        <div className="mb-6 flex items-center gap-1 border-b border-black/10 pb-0 dark:border-white/10">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={[
                '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors',
                section === s.key
                  ? 'border-black text-black dark:border-white dark:text-white'
                  : 'border-transparent text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === 'profile' && <ProfileTab />}
        {section === 'work' && <WorkTab />}
        {section === 'education' && <EducationTab />}
        {section === 'skills' && <SkillsTab />}
        {section === 'projects' && <ProjectsTab />}
      </main>
    </div>
  )
}
