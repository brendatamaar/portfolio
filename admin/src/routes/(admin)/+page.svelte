<script lang="ts">
  import { untrack } from 'svelte'
  import { enhance } from '$app/forms'
  import type { PageData, ActionData } from './$types'
  import type { AdminPostSummary } from '$lib/types'
  import { fmtDate } from '$lib/utils'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  let posts = $state<AdminPostSummary[]>(untrack(() => data.posts ?? []))
  $effect(() => {
    posts = data.posts ?? []
  })
  let filterStatus = $state<'all' | 'draft' | 'published'>('all')

  let filtered = $derived(
    filterStatus === 'all' ? posts : posts.filter((p) => p.status === filterStatus),
  )

  let deletingId = $state<number | null>(null)

  const counts = $derived(
    posts.reduce(
      (acc, p) => {
        acc[p.status]++
        return acc
      },
      { draft: 0, published: 0 },
    ),
  )

  const tabs = $derived([
    { key: 'all' as const, label: 'All', count: posts.length },
    { key: 'draft' as const, label: 'Draft', count: counts.draft },
    { key: 'published' as const, label: 'Published', count: counts.published },
  ])
</script>

<svelte:head>
  <title>Posts — Admin</title>
</svelte:head>

<div class="min-h-screen bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
  <main class="mx-auto max-w-4xl px-6 py-8">
    <h1 class="mb-6 text-3xl font-black tracking-tighter uppercase">Posts</h1>

    {#if form?.error}
      <div class="mb-4 border border-red-500 p-2 font-mono text-xs text-red-500">
        {form.error}
      </div>
    {/if}

    <!-- Filter tabs -->
    {#if posts.length > 0}
      <div class="mb-4 flex items-center gap-1 border-b border-black/10 dark:border-white/10">
        {#each tabs as tab}
          <button
            onclick={() => (filterStatus = tab.key)}
            class={[
              '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors',
              filterStatus === tab.key
                ? 'border-black text-black dark:border-white dark:text-white'
                : 'border-transparent text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60',
            ].join(' ')}
          >
            {tab.label}
            <span
              class={[
                'px-1 py-px text-[9px]',
                filterStatus === tab.key ? 'bg-black/15 dark:bg-white/15' : 'bg-black/5 dark:bg-white/5',
              ].join(' ')}
            >
              {tab.count}
            </span>
          </button>
        {/each}
        <a
          href="/posts/new"
          class="ml-auto flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          + New post
        </a>
      </div>
    {:else}
      <div class="mb-4 flex justify-end">
        <a
          href="/posts/new"
          class="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          + New post
        </a>
      </div>
    {/if}

    {#if filtered.length === 0}
      <p class="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
        {posts.length === 0 ? 'No posts yet.' : `No ${filterStatus} posts.`}
      </p>
    {:else}
      <div class="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
        {#each filtered as post (post.id)}
          <div class="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
            <div class="min-w-0 flex-1">
              <div class="mb-0.5 flex items-center gap-2">
                <span
                  class={[
                    'px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase',
                    post.status === 'published'
                      ? 'border border-green-500/30 bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'border border-black/20 bg-black/10 text-black/40 dark:border-white/20 dark:bg-white/10 dark:text-white/40',
                  ].join(' ')}
                >
                  {post.status}
                </span>
                <span class="font-mono text-[10px] text-black/30 dark:text-white/30">
                  {post.status === 'published' && post.publishedAt
                    ? fmtDate(post.publishedAt, 'Published')
                    : fmtDate(post.createdAt, 'Created')}
                </span>
              </div>
              <p class="truncate text-sm font-bold">{post.title}</p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <a
                href="/posts/{post.id}"
                class="p-1.5 text-black/30 transition-all hover:bg-black hover:text-white dark:text-white/30 dark:hover:bg-white dark:hover:text-black"
                title="Edit"
              >
                ✎
              </a>
              <form
                method="POST"
                action="?/delete"
                use:enhance={() => {
                  deletingId = post.id
                  return async ({ update }) => {
                    posts = posts.filter((p) => p.id !== post.id)
                    deletingId = null
                    await update({ reset: false })
                  }
                }}
              >
                <input type="hidden" name="id" value={post.id} />
                <button
                  type="submit"
                  disabled={deletingId === post.id}
                  onclick={(e) => {
                    if (!confirm('Delete this post?')) e.preventDefault()
                  }}
                  class="p-1.5 text-black/30 transition-all hover:bg-red-500 hover:text-white dark:text-white/30 dark:hover:bg-red-500 dark:hover:text-white disabled:opacity-40"
                  title="Delete"
                >
                  ✕
                </button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
