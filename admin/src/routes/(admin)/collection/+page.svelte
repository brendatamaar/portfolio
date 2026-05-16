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

<div class="min-h-screen bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
  <main class="mx-auto max-w-4xl px-6 py-8">
    <h1 class="mb-6 text-3xl font-black tracking-tighter uppercase">Collection</h1>

    <div class="mb-6 flex items-center gap-1 border-b border-black/10 pb-0 dark:border-white/10">
      {#each tabs as t}
        <button
          onclick={() => (tab = t.key)}
          class={[
            '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors',
            tab === t.key
              ? 'border-black text-black dark:border-white dark:text-white'
              : 'border-transparent text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60',
          ].join(' ')}
        >
          {t.label}
        </button>
      {/each}
    </div>

    {#if tab === 'books'}
      <BooksTab initialItems={data.books} />
    {:else}
      <AlbumsTab initialItems={data.albums} />
    {/if}
  </main>
</div>
