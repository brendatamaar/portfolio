<script lang="ts">
  import type { PageData } from './$types'
  import type { CollectionTab } from '$lib/types'
  import BooksTab from '$lib/components/BooksTab.svelte'
  import AlbumsTab from '$lib/components/AlbumsTab.svelte'

  let { data }: { data: PageData } = $props()
  let tab = $state<CollectionTab>('books')

  const tabs: { key: CollectionTab; label: string }[] = [
    { key: 'books', label: 'Books' },
    { key: 'albums', label: 'Albums' },
  ]
</script>

<svelte:head>
  <title>Collection — Admin</title>
</svelte:head>

<div class="bg-page text-ink">
  <main class="mx-auto w-full max-w-176 px-4 pt-8 pb-16 sm:px-0">
    <h1 class="text-[16px] text-ink">Collection</h1><p class="mt-1 mb-8 text-[14px] text-quiet">Books and albums shown on the site.</p>

    <div class="mb-8 flex items-center gap-4 text-[14px]" role="tablist" aria-label="Collection">
      {#each tabs as t (t.key)}
        <button role="tab" aria-selected={tab === t.key} onclick={() => (tab = t.key)} class="transition-colors {tab === t.key ? 'font-medium text-ink' : 'text-quiet hover:text-ink'}">{t.label}</button>
      {/each}
    </div>

    {#if tab === 'books'}
      <BooksTab initialItems={data.books} />
    {:else}
      <AlbumsTab initialItems={data.albums} />
    {/if}
  </main>
</div>
