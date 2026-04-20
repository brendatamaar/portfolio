export type Tab = 'books' | 'albums'

export type BaseItem = {
  id: number
  title: string
  featured: boolean
  year: number | null
  coverUrl: string | null
}

export type BaseSearchResult = {
  title: string
  coverUrl: string | null
  year: number | null
}

export type CollectionTabProps<
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
