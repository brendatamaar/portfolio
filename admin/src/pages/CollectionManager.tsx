import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Trash2Icon, PlusIcon, LoaderIcon, SearchIcon } from 'lucide-react'
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

// Books tab

const STATUS_OPTIONS = [
  { value: 'finished', label: 'Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'want', label: 'Want to read' },
] as const

function BooksTab() {
  const [items, setItems] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState<'reading' | 'finished' | 'want'>(
    'finished',
  )
  const [selectedCover, setSelectedCover] = useState<string | null | undefined>(
    undefined,
  )
  const [selectedYear, setSelectedYear] = useState<number | null | undefined>(
    undefined,
  )
  const [adding, setAdding] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { query, results, searching, search, clear } =
    useAutocomplete<BookSearchResult>(api.books.search)

  useEffect(() => {
    api.books
      .list()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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

  function selectResult(r: BookSearchResult) {
    search(r.title)
    setAuthor(r.author)
    setSelectedCover(r.coverUrl)
    setSelectedYear(r.year)
    setDropdownOpen(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || !author.trim()) return
    setAdding(true)
    try {
      const item = await api.books.create({
        title: query.trim(),
        author: author.trim(),
        status,
        coverUrl: selectedCover,
        year: selectedYear,
      })
      setItems((p) => [item, ...p])
      clear()
      setAuthor('')
      setStatus('finished')
      setSelectedCover(undefined)
      setSelectedYear(undefined)
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number, bookTitle: string) {
    if (!confirm(`Delete "${bookTitle}"?`)) return
    await api.books.delete(id)
    setItems((p) => p.filter((x) => x.id !== id))
  }

  const showDropdown = dropdownOpen && (searching || results.length > 0)

  return (
    <div>
      <form
        onSubmit={handleAdd}
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
              placeholder="Search by title or ISBN..."
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

          {/* Dropdown */}
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
                    onClick={() => selectResult(r)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="h-10 w-8 shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
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
                        {r.author || '—'}
                        {r.year && <span className="ml-1.5">{r.year}</span>}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Author */}
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

        {/* Status */}
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

        {/* Cover preview */}
        {selectedCover && (
          <div className="h-10 w-8 shrink-0 overflow-hidden border border-black/20 dark:border-white/20">
            <img
              src={selectedCover}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={adding || !query.trim() || !author.trim()}
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
          No books yet.
        </p>
      ) : (
        <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="h-10 w-8 shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
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
                  {item.author}
                  {item.year && <span className="ml-1.5">{item.year}</span>}
                </p>
              </div>
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

// Albums tab

function AlbumsTab() {
  const [items, setItems] = useState<AlbumItem[]>([])
  const [loading, setLoading] = useState(true)
  const [artist, setArtist] = useState('')
  const [selectedCover, setSelectedCover] = useState<string | null | undefined>(
    undefined,
  )
  const [selectedYear, setSelectedYear] = useState<number | null | undefined>(
    undefined,
  )
  const [adding, setAdding] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { query, results, searching, search, clear } =
    useAutocomplete<AlbumSearchResult>(api.albums.search)

  useEffect(() => {
    api.albums
      .list()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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

  function selectResult(r: AlbumSearchResult) {
    search(r.title)
    setArtist(r.artist)
    setSelectedCover(r.coverUrl)
    setSelectedYear(r.year)
    setDropdownOpen(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || !artist.trim()) return
    setAdding(true)
    try {
      const item = await api.albums.create({
        title: query.trim(),
        artist: artist.trim(),
        coverUrl: selectedCover,
        year: selectedYear,
      })
      setItems((p) => [item, ...p])
      clear()
      setArtist('')
      setSelectedCover(undefined)
      setSelectedYear(undefined)
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number, albumTitle: string) {
    if (!confirm(`Delete "${albumTitle}"?`)) return
    await api.albums.delete(id)
    setItems((p) => p.filter((x) => x.id !== id))
  }

  const showDropdown = dropdownOpen && (searching || results.length > 0)

  return (
    <div>
      <form
        onSubmit={handleAdd}
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
              placeholder="Search album title..."
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
                    onClick={() => selectResult(r)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
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
                        {r.artist || '—'}
                        {r.year && <span className="ml-1.5">{r.year}</span>}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Artist */}
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

        {/* Cover preview */}
        {selectedCover && (
          <div className="h-10 w-10 shrink-0 overflow-hidden border border-black/20 dark:border-white/20">
            <img
              src={selectedCover}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={adding || !query.trim() || !artist.trim()}
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
          No albums yet.
        </p>
      ) : (
        <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
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
                  {item.artist}
                  {item.year && <span className="ml-1.5">{item.year}</span>}
                </p>
              </div>
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
