import { useState, useCallback } from 'react'
import { api } from '../../lib/api'
import type { BookItem, BookSearchResult } from '../../lib/api'
import { CollectionTab } from './shared'

const STATUS_OPTIONS = [
  { value: 'finished', label: 'Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'want', label: 'Want to read' },
] as const

export function BooksTab() {
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<'reading' | 'finished' | 'want'>(
    'finished',
  )

  const createFn = useCallback(
    (
      title: string,
      coverUrl: string | null | undefined,
      year: number | null | undefined,
    ) =>
      api.books.create({
        title,
        author: author.trim(),
        status,
        coverUrl,
        year,
      }),
    [author, status],
  )

  const onResultSelect = useCallback((r: BookSearchResult) => {
    setAuthor(r.author)
  }, [])

  const onAfterCreate = useCallback(() => {
    setAuthor('')
    setStatus('finished')
  }, [])

  return (
    <CollectionTab<BookItem, BookSearchResult>
      searchFn={api.books.search}
      listFn={api.books.list}
      featureFn={api.books.feature}
      deleteFn={api.books.delete}
      createFn={createFn}
      onAfterCreate={onAfterCreate}
      canSubmit={author.trim().length > 0}
      searchPlaceholder="Search by title or ISBN..."
      emptyText="No books yet."
      coverClass="h-10 w-8"
      onResultSelect={onResultSelect}
      renderDropdownMeta={(r) => <>{r.author || '—'}</>}
      renderItemMeta={(item) => <>{item.author}</>}
      renderItemBadge={(item) => (
        <span
          className={`shrink-0 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase ${
            item.status === 'reading'
              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : item.status === 'finished'
                ? 'bg-[#FFE600]/30 text-black/60 dark:text-white/60'
                : 'bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40'
          }`}
        >
          {item.status === 'finished' ? 'read' : item.status}
        </span>
      )}
      extraFormFields={
        <>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
              Author
            </label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="border border-black/20 bg-transparent px-3 py-1.5 text-sm focus:border-black focus:outline-none dark:border-white/20 dark:focus:border-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="border border-black/20 bg-white px-3 py-1.5 text-sm focus:border-black focus:outline-none dark:border-white/20 dark:bg-[#0a0a0a] dark:focus:border-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </>
      }
    />
  )
}
