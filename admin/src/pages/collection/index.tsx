import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Tab } from '../../types/collection'
import { BooksTab } from './BooksTab'
import { AlbumsTab } from './AlbumsTab'

export default function CollectionManager() {
  const [tab, setTab] = useState<Tab>('books')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'books', label: 'Books' },
    { key: 'albums', label: 'Albums' },
  ]

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
          Collection
        </h1>

        <div className="mb-6 flex items-center gap-1 border-b border-black/10 pb-0 dark:border-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors',
                tab === t.key
                  ? 'border-black text-black dark:border-white dark:text-white'
                  : 'border-transparent text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'books' ? <BooksTab /> : <AlbumsTab />}
      </main>
    </div>
  )
}
