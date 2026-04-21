import { Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  SaveIcon,
  GlobeIcon,
  EyeOffIcon,
  SunIcon,
  MoonIcon,
} from 'lucide-react'
import type { Post } from '../types/api.js'

interface PostEditorHeaderProps {
  title: string
  setTitle: (title: string) => void
  titleId: string
  setTitleId: (title: string) => void
  slug: string
  setSlug: (slug: string) => void
  status: Post['status']
  setStatus: (status: Post['status']) => void
  langTab: 'en' | 'id'
  setLangTab: (lang: 'en' | 'id') => void
  savedAgo: string
  saveMsg: string
  saving: boolean
  onSave: () => void
  isDark: boolean
  onToggleTheme: () => void
  isNew: boolean
}

export default function PostEditorHeader({
  title,
  setTitle,
  titleId,
  setTitleId,
  slug,
  setSlug,
  status,
  setStatus,
  langTab,
  setLangTab,
  savedAgo,
  saveMsg,
  saving,
  onSave,
  isDark,
  onToggleTheme,
  isNew,
}: PostEditorHeaderProps) {
  const activeTitle = langTab === 'id' ? titleId : title
  const setActiveTitle = langTab === 'id' ? setTitleId : setTitle

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 px-4 dark:border-white/10">
      <Link
        to="/"
        aria-label="Back to posts list"
        className="shrink-0 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
      >
        <ArrowLeftIcon size={15} />
      </Link>

      {/* Language tabs */}
      <div className="flex shrink-0 gap-0.5 border border-black/10 dark:border-white/10">
        {(['en', 'id'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLangTab(l)}
            className={[
              'px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-colors',
              langTab === l
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white',
            ].join(' ')}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <input
          value={activeTitle}
          onChange={(e) => setActiveTitle(e.target.value)}
          placeholder={
            langTab === 'id' ? 'Judul tulisan... (ID)' : 'Post title...'
          }
          className="min-w-0 flex-1 bg-transparent text-base font-black tracking-tight text-black uppercase placeholder-black/20 outline-none dark:text-white dark:placeholder-white/20"
        />
        {/* Status badge */}
        <span
          className={[
            'shrink-0 border px-1.5 py-0.5 font-mono text-[9px] tracking-widest uppercase',
            status === 'published'
              ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
              : 'border-black/15 text-black/30 dark:border-white/15 dark:text-white/30',
          ].join(' ')}
        >
          {status}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {saveMsg && (
          <span className="font-mono text-[10px] tracking-widest text-red-500 uppercase">
            {saveMsg}
          </span>
        )}
        {!saveMsg && savedAgo && (
          <span className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
            {savedAgo}
          </span>
        )}

        {status === 'published' ? (
          <button
            onClick={() => setStatus('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 border border-black/20 px-3 py-1.5 text-xs font-bold tracking-wide text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black disabled:opacity-50 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
          >
            <EyeOffIcon size={12} />
            Unpublish
          </button>
        ) : (
          <button
            onClick={() => setStatus('published')}
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#FFE600] px-3 py-1.5 text-xs font-bold tracking-wide text-black uppercase transition-colors hover:bg-yellow-300 disabled:opacity-50"
          >
            <GlobeIcon size={12} />
            Publish
          </button>
        )}

        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          <SaveIcon size={12} />
          Save
        </button>

        <button
          onClick={onToggleTheme}
          className="p-1.5 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          title="Toggle theme"
        >
          {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>
      </div>
    </header>
  )
}
