<script lang="ts" generics="TItem extends CollectionBaseItem, TSearch extends CollectionBaseSearchResult">
  import { Search, Loader, Plus, Star, Trash2 } from 'lucide-svelte'
  import type { Snippet } from 'svelte'
  import type { CollectionBaseItem, CollectionBaseSearchResult } from '$lib/types'

  interface Props {
    initialItems: TItem[]
    searchFn: (q: string) => Promise<TSearch[]>
    createFn: (
      title: string,
      coverUrl: string | null | undefined,
      year: number | null | undefined,
    ) => Promise<TItem>
    featureFn: (id: number) => Promise<TItem>
    deleteFn: (id: number) => Promise<{ ok: boolean }>
    onAfterCreate?: () => void
    canSubmit: boolean
    searchPlaceholder: string
    emptyText: string
    coverClass: string
    onResultSelect: (result: TSearch) => void
    extraFormFields?: Snippet
    dropdownMeta: Snippet<[TSearch]>
    itemMeta: Snippet<[TItem]>
    itemBadge?: Snippet<[TItem]>
  }

  let {
    initialItems,
    searchFn,
    createFn,
    featureFn,
    deleteFn,
    onAfterCreate,
    canSubmit,
    searchPlaceholder,
    emptyText,
    coverClass,
    onResultSelect,
    extraFormFields,
    dropdownMeta,
    itemMeta,
    itemBadge,
  }: Props = $props()

  let items = $state<TItem[]>(initialItems)
  let query = $state('')
  let results = $state<TSearch[]>([])
  let searching = $state(false)
  let dropdownOpen = $state(false)
  let selectedCover = $state<string | null | undefined>(undefined)
  let selectedYear = $state<number | null | undefined>(undefined)
  let adding = $state(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function handleSearchInput(value: string) {
    query = value
    selectedCover = undefined
    dropdownOpen = true
    if (debounceTimer) clearTimeout(debounceTimer)
    if (value.trim().length < 2) {
      results = []
      return
    }
    debounceTimer = setTimeout(async () => {
      searching = true
      try {
        results = await searchFn(value.trim())
      } catch {
        results = []
      } finally {
        searching = false
      }
    }, 350)
  }

  function selectResult(r: TSearch) {
    query = r.title
    selectedCover = r.coverUrl
    selectedYear = r.year
    dropdownOpen = false
    onResultSelect(r)
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!query.trim() || !canSubmit || adding) return
    adding = true
    try {
      const item = await createFn(query.trim(), selectedCover, selectedYear)
      items = [item, ...items]
      query = ''
      selectedCover = undefined
      selectedYear = undefined
      onAfterCreate?.()
    } catch (err) {
      console.error(err)
    } finally {
      adding = false
    }
  }

  async function handleFeature(id: number) {
    try {
      const updated = await featureFn(id)
      items = items.map((x) => ({ ...x, featured: x.id === updated.id }))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await deleteFn(id)
    items = items.filter((x) => x.id !== id)
  }

  let showDropdown = $derived(dropdownOpen && (searching || results.length > 0))
</script>

<svelte:window onclick={(e) => {
  if (!(e.target as HTMLElement).closest('[data-autocomplete]')) dropdownOpen = false
}} />

<form
  onsubmit={handleSubmit}
  class="mb-6 flex flex-wrap items-end gap-2 border border-ring p-4 dark:border-white/10"
>
  <!-- Search with autocomplete -->
  <div class="relative flex flex-col gap-1" data-autocomplete>
    <label class="text-[12px] text-quiet dark:text-quiet">
      Title
    </label>
    <div class="relative flex items-center">
      <input
        value={query}
        oninput={(e) => handleSearchInput((e.target as HTMLInputElement).value)}
        onfocus={() => results.length > 0 && (dropdownOpen = true)}
        placeholder={searchPlaceholder}
        autocomplete="off"
        class="w-64 border border-leader bg-transparent py-1.5 pr-8 pl-3 text-sm focus:border-quiet focus:outline-none dark:border-white/20 dark:focus:border-quiet"
      />
      <span class="pointer-events-none absolute right-2.5 text-quiet">
        {#if searching}
          <Loader size={12} class="animate-spin" />
        {:else}
          <Search size={12} />
        {/if}
      </span>
    </div>

    {#if showDropdown}
      <div class="absolute top-full left-0 z-50 mt-1 w-80 border border-leader bg-page shadow-popup dark:border-white/20 dark:bg-page">
        {#if searching && results.length === 0}
          <div class="px-3 py-2 font-mono text-[11px] text-quiet">Searching...</div>
        {:else if results.length === 0}
          <div class="px-3 py-2 font-mono text-[11px] text-quiet">No results.</div>
        {:else}
          {#each results as r}
            <button
              type="button"
              onclick={() => selectResult(r)}
              class="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-raised"
            >
              <div class="{coverClass} shrink-0 overflow-hidden border border-ring bg-raised dark:border-white/10 dark:bg-white/5">
                {#if r.coverUrl}
                  <img src={r.coverUrl} alt="" loading="lazy" decoding="async" class="h-full w-full object-cover" />
                {:else}
                  <div class="flex h-full w-full items-center justify-center">
                    <span class="font-mono text-[8px] text-quiet">?</span>
                  </div>
                {/if}
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">{r.title}</p>
                <p class="truncate font-mono text-xs text-quiet">
                  {@render dropdownMeta(r)}
                  {#if r.year}<span class="ml-1.5">{r.year}</span>{/if}
                </p>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  {@render extraFormFields?.()}

  {#if selectedCover}
    <div class="{coverClass} shrink-0 overflow-hidden border border-leader">
      <img src={selectedCover} alt="" loading="lazy" decoding="async" class="h-full w-full object-cover" />
    </div>
  {/if}

  <button
    type="submit"
    disabled={adding || !query.trim() || !canSubmit}
    class="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-page transition-opacity hover:opacity-80 disabled:opacity-40"
  >
    {#if adding}
      <Loader size={12} class="animate-spin" />
    {:else}
      <Plus size={12} />
    {/if}
    Add
  </button>
</form>

{#if items.length === 0}
  <p class="text-[13px] text-quiet dark:text-quiet">
    {emptyText}
  </p>
{:else}
  <div class="divide-y divide-black/10 border border-ring dark:divide-white/10 dark:border-white/10">
    {#each items as item (item.id)}
      <div class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised">
        <div class="{coverClass} shrink-0 overflow-hidden border border-ring bg-raised dark:border-white/10 dark:bg-white/5">
          {#if item.coverUrl}
            <img src={item.coverUrl} alt={item.title} loading="lazy" decoding="async" class="h-full w-full object-cover" />
          {:else}
            <div class="flex h-full w-full items-center justify-center">
              <span class="font-mono text-[8px] text-quiet">N/A</span>
            </div>
          {/if}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold">{item.title}</p>
          <p class="truncate font-mono text-xs text-quiet">
            {@render itemMeta(item)}
            {#if item.year}<span class="ml-1.5">{item.year}</span>{/if}
          </p>
        </div>
        {@render itemBadge?.(item)}
        <button
          onclick={() => handleFeature(item.id)}
          class="p-1.5 transition-all {item.featured ? 'text-pen' : 'text-quiet hover:text-pen dark:text-white/20'}"
          title={item.featured ? 'Featured' : 'Set as featured'}
        >
          <Star size={14} fill={item.featured ? 'currentColor' : 'none'} />
        </button>
        <button
          onclick={() => handleDelete(item.id, item.title)}
          class="p-1.5 text-quiet transition-all hover:bg-red-500 hover:text-white dark:text-quiet"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    {/each}
  </div>
{/if}
