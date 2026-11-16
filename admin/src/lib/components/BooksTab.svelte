<script lang="ts">
  import type { BookItem, BookSearchResult } from '$lib/types'
  import { api } from '$lib/api'
  import CollectionTabBase from './CollectionTabBase.svelte'

  let { initialItems }: { initialItems: BookItem[] } = $props()

  let author = $state('')
  let status = $state<'reading' | 'finished' | 'want'>('finished')

  const STATUS_OPTIONS = [
    { value: 'finished', label: 'Read' },
    { value: 'reading', label: 'Reading' },
    { value: 'want', label: 'Want to read' },
  ] as const

  function onResultSelect(r: BookSearchResult) {
    author = r.author
  }

  function afterCreate() {
    author = ''
    status = 'finished'
  }

  function createFn(
    title: string,
    coverUrl: string | null | undefined,
    year: number | null | undefined,
  ) {
    return api.createBook({ title, author: author.trim(), status, coverUrl, year })
  }

  let canSubmit = $derived(author.trim().length > 0)
</script>

<CollectionTabBase
  {initialItems}
  searchFn={api.searchBooks}
  {createFn}
  featureFn={api.featureBook}
  deleteFn={api.deleteBook}
  onAfterCreate={afterCreate}
  {canSubmit}
  searchPlaceholder="Search by title or ISBN..."
  emptyText="No books yet."
  coverClass="h-10 w-8"
  {onResultSelect}
>
  {#snippet extraFormFields()}
    <div class="flex flex-col gap-1">
      <label class="text-[12px] text-quiet dark:text-quiet">
        Author
      </label>
      <input
        value={author}
        oninput={(e) => (author = (e.target as HTMLInputElement).value)}
        placeholder="Author name"
        class="border border-leader bg-transparent px-3 py-1.5 text-sm focus:border-quiet focus:outline-none dark:border-white/20 dark:focus:border-quiet"
      />
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-[12px] text-quiet dark:text-quiet">
        Status
      </label>
      <select
        value={status}
        onchange={(e) => (status = (e.target as HTMLSelectElement).value as typeof status)}
        class="border border-leader bg-transparent px-3 py-1.5 text-sm focus:border-quiet focus:outline-none dark:border-white/20 dark:focus:border-quiet"
      >
        {#each STATUS_OPTIONS as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
  {/snippet}

  {#snippet dropdownMeta(r: BookSearchResult)}
    {r.author || '—'}
  {/snippet}

  {#snippet itemMeta(item: BookItem)}
    {item.author}
  {/snippet}

  {#snippet itemBadge(item: BookItem)}
    <span class={[
      'shrink-0 px-1.5 py-0.5 text-[11px] font-medium',
      item.status === 'reading'
        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
        : item.status === 'finished'
          ? 'bg-pen/30 text-body'
          : 'bg-raised text-quiet dark:bg-white/10 dark:text-quiet',
    ].join(' ')}>
      {item.status === 'finished' ? 'read' : item.status}
    </span>
  {/snippet}
</CollectionTabBase>
