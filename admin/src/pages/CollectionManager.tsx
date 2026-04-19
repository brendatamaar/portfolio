import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Trash2Icon,
  PlusIcon,
  LoaderIcon,
  SearchIcon,
  StarIcon,
} from 'lucide-react'
import { api } from '../lib/api.ts'
import type {
  BookItem,
  AlbumItem,
  BookSearchResult,
  AlbumSearchResult,
} from '../lib/api.ts'

type Tab = 'books' | 'albums'

// Generic autocomplete hook

function useAutocomplete<T>(
  searchFn: (q: string) => Promise<T[]>,
  minChars = 2,
  debounceMs = 350,
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    (value: string) => {
      setQuery(value)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (value.trim().length < minChars) {
        setResults([])
        return
      }
      timerRef.current = setTimeout(async () => {
        setSearching(true)
        try {
          const data = await searchFn(value.trim())
          setResults(data)
        } catch {
          setResults([])
        } finally {
          setSearching(false)
        }
      }, debounceMs)
    },
    [searchFn, minChars, debounceMs],
  )

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
  }, [])

  return { query, results, searching, search, clear }
}

// Generic collection tab
// CollectionTab owns: items, loading, adding, query/cover/year state.
// Parent owns only extra fields (author/artist/status) and passes createFn as a closure.

type BaseItem = {
  id: number
  title: string
  featured: boolean
  year: number | null
  coverUrl: string | null
}

type BaseSearchResult = {
  title: string
  coverUrl: string | null
  year: number | null
}

type CollectionTabProps<
  TItem extends BaseItem,
  TSearch extends BaseSearchResult,
> = {
  searchFn: (q: string) => Promise<TSearch[]>
  listFn: () => Promise<TItem[]>
  featureFn: (id: number) => Promise<TItem>
  deleteFn: (id: number) => Promise<{ ok: boolean }>
  /** Called with (title, coverUrl, year) — parent closes over its extra fields */
  createFn: (
    title: string,
    coverUrl: string | null | undefined,
    year: number | null | undefined,
  ) => Promise<TItem>
  /** Called after successful create so parent can reset its extra fields */
  onAfterCreate?: () => void
  /** True when parent's required extra fields (author/artist) are non-empty */
  canSubmit: boolean
  searchPlaceholder: string
  emptyText: string
  /** Tailwind classes for the cover thumbnail size e.g. "h-10 w-8" */
  coverClass: string
  /** Called when user picks a search result so parent can populate its extra fields */
  onResultSelect: (result: TSearch) => void
  /** Extra form fields between search input and submit button */
  extraFormFields: React.ReactNode
  /** Subtitle line in the search dropdown */
  renderDropdownMeta: (result: TSearch) => React.ReactNode
  /** Subtitle line in the item list */
  renderItemMeta: (item: TItem) => React.ReactNode
  /** Optional badge rendered after subtitle (e.g. status badge for books) */
  renderItemBadge?: (item: TItem) => React.ReactNode
}

function CollectionTab<
  TItem extends BaseItem,
  TSearch extends BaseSearchResult,
>({
  searchFn,
  listFn,
  featureFn,
  deleteFn,
  createFn,
  onAfterCreate,
  canSubmit,
  searchPlaceholder,
  emptyText,
  coverClass,
  onResultSelect,
  extraFormFields,
  renderDropdownMeta,
  renderItemMeta,
  renderItemBadge,
}: CollectionTabProps<TItem, TSearch>) {
  const [items, setItems] = useState<TItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedCover, setSelectedCover] = useState<string | null | undefined>(
    undefined,
  )
  const [selectedYear, setSelectedYear] = useState<number | null | undefined>(
    undefined,
  )
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { query, results, searching, search, clear } =
    useAutocomplete<TSearch>(searchFn)

  useEffect(() => {
    listFn()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [listFn])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleResultSelect = useCallback(
    (result: TSearch) => {
      search(result.title)
      setSelectedCover(result.coverUrl)
      setSelectedYear(result.year)
      setDropdownOpen(false)
      onResultSelect(result)
    },
    [search, onResultSelect],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !canSubmit || adding) return
    setAdding(true)
    try {
      const item = await createFn(query.trim(), selectedCover, selectedYear)
      setItems((prev) => [item, ...prev])
      clear()
      setSelectedCover(undefined)
      setSelectedYear(undefined)
      onAfterCreate?.()
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  async function handleFeature(id: number) {
    try {
      const updated = await featureFn(id)
      setItems((prev) =>
        prev.map((x) => ({ ...x, featured: x.id === updated.id })),
      )
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await deleteFn(id)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const showDropdown = dropdownOpen && (searching || results.length > 0)

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-wrap items-end gap-2 border border-black/10 p-4 dark:border-white/10"
      >
        {/* Title with autocomplete */}
        <div className="relative flex flex-col gap-1" ref={containerRef}>
          <label className="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Title
          </label>
          <div className="relative flex items-center">
            <input
              value={query}
              onChange={(e) => {
                search(e.target.value)
                setDropdownOpen(true)
                setSelectedCover(undefined)
              }}
              onFocus={() => results.length > 0 && setDropdownOpen(true)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="w-64 border border-black/20 bg-transparent py-1.5 pr-8 pl-3 text-sm focus:border-black focus:outline-none dark:border-white/20 dark:focus:border-white"
            />
            <span className="pointer-events-none absolute right-2.5 text-black/30 dark:text-white/30">
              {searching ? (
                <LoaderIcon size={12} className="animate-spin" />
              ) : (
                <SearchIcon size={12} />
              )}
            </span>
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 z-50 mt-1 w-80 border border-black/20 bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.15)] dark:border-white/20 dark:bg-[#0a0a0a]">
              {searching && results.length === 0 ? (
                <div className="px-3 py-2 font-mono text-[10px] text-black/40 dark:text-white/40">
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 font-mono text-[10px] text-black/40 dark:text-white/40">
                  No results.
                </div>
              ) : (
                results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleResultSelect(r)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div
                      className={`shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 ${coverClass}`}
                    >
                      {r.coverUrl ? (
                        <img
                          src={r.coverUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-mono text-[8px] text-black/20">
                            ?
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{r.title}</p>
                      <p className="truncate font-mono text-xs text-black/40 dark:text-white/40">
                        {renderDropdownMeta(r)}
                        {r.year && <span className="ml-1.5">{r.year}</span>}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {extraFormFields}

        {selectedCover && (
          <div
            className={`shrink-0 overflow-hidden border border-black/20 dark:border-white/20 ${coverClass}`}
          >
            <img
              src={selectedCover}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={adding || !query.trim() || !canSubmit}
          className="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {adding ? (
            <LoaderIcon size={12} className="animate-spin" />
          ) : (
            <PlusIcon size={12} />
          )}
          Add
        </button>
      </form>

      {loading ? (
        <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          Loading...
        </p>
      ) : items.length === 0 ? (
        <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          {emptyText}
        </p>
      ) : (
        <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div
                className={`shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 ${coverClass}`}
              >
                {item.coverUrl ? (
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-mono text-[8px] text-black/30 dark:text-white/30">
                      N/A
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{item.title}</p>
                <p className="truncate font-mono text-xs text-black/40 dark:text-white/40">
                  {renderItemMeta(item)}
                  {item.year && <span className="ml-1.5">{item.year}</span>}
                </p>
              </div>
              {renderItemBadge?.(item)}
              <button
                onClick={() => handleFeature(item.id)}
                className={`p-1.5 transition-all ${item.featured ? 'text-[#FFE600]' : 'text-black/20 hover:text-[#FFE600] dark:text-white/20'}`}
                title={item.featured ? 'Featured' : 'Set as featured'}
              >
                <StarIcon
                  size={14}
                  fill={item.featured ? 'currentColor' : 'none'}
                />
              </button>
              <button
                onClick={() => handleDelete(item.id, item.title)}
                className="p-1.5 text-black/30 transition-all hover:bg-red-500 hover:text-white dark:text-white/30"
                title="Delete"
              >
                <Trash2Icon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Books tab

const STATUS_OPTIONS = [
  { value: 'finished', label: 'Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'want', label: 'Want to read' },
] as const

function BooksTab() {
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

// Albums tab

function AlbumsTab() {
  const [artist, setArtist] = useState('')

  const createFn = useCallback(
    (
      title: string,
      coverUrl: string | null | undefined,
      year: number | null | undefined,
    ) => api.albums.create({ title, artist: artist.trim(), coverUrl, year }),
    [artist],
  )

  const onResultSelect = useCallback((r: AlbumSearchResult) => {
    setArtist(r.artist)
  }, [])

  const onAfterCreate = useCallback(() => {
    setArtist('')
  }, [])

  return (
    <CollectionTab<AlbumItem, AlbumSearchResult>
      searchFn={api.albums.search}
      listFn={api.albums.list}
      featureFn={api.albums.feature}
      deleteFn={api.albums.delete}
      createFn={createFn}
      onAfterCreate={onAfterCreate}
      canSubmit={artist.trim().length > 0}
      searchPlaceholder="Search album title..."
      emptyText="No albums yet."
      coverClass="h-10 w-10"
      onResultSelect={onResultSelect}
      renderDropdownMeta={(r) => <>{r.artist || '—'}</>}
      renderItemMeta={(item) => <>{item.artist}</>}
      extraFormFields={
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Artist
          </label>
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist name"
            className="border border-black/20 bg-transparent px-3 py-1.5 text-sm focus:border-black focus:outline-none dark:border-white/20 dark:focus:border-white"
          />
        </div>
      }
    />
  )
}

// Page

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
