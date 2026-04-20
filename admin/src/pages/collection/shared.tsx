import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LoaderIcon,
  SearchIcon,
  StarIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import type {
  BaseItem,
  BaseSearchResult,
  CollectionTabProps,
} from '../../types/collection'

export function useAutocomplete<T>(
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

export function CollectionTab<
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
