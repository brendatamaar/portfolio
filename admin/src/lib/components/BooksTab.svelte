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
      <label class="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
        Author
      </label>
      <input
        value={author}
        oninput={(e) => (author = (e.target as HTMLInputElement).value)}
        placeholder="Author name"
        class="border border-black/20 bg-transparent px-3 py-1.5 text-sm focus:border-black focus:outline-none dark:border-white/20 dark:focus:border-white"
      />
    </div>
    <div class="flex flex-col gap-1">
      <label class="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
        Status
      </label>
      <select
        value={status}
        onchange={(e) => (status = (e.target as HTMLSelectElement).value as typeof status)}
        class="border border-black/20 bg-transparent px-3 py-1.5 text-sm focus:border-black focus:outline-none dark:border-white/20 dark:focus:border-white"
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
      'shrink-0 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase',
      item.status === 'reading'
        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
        : item.status === 'finished'
          ? 'bg-[#FFE600]/30 text-black/60 dark:text-white/60'
          : 'bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40',
    ].join(' ')}>
      {item.status === 'finished' ? 'read' : item.status}
    </span>
  {/snippet}
</CollectionTabBase>
