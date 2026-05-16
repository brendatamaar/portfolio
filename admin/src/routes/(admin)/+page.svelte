<script lang="ts">
  import { untrack } from 'svelte'
  import { enhance } from '$app/forms'
  import { Send, Archive, Download, Pencil, Trash2 } from 'lucide-svelte'
  import type { PageData, ActionData } from './$types'
  import type { AdminPostSummary } from '$lib/types'
  import { fmtDate, glossaryToMarkdown, bibliographyToMarkdown } from '$lib/utils'
  import { api } from '$lib/api'

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
  let togglingId = $state<number | null>(null)
  let downloadingId = $state<number | null>(null)

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

  async function toggleStatus(post: AdminPostSummary) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    togglingId = post.id
    try {
      const updated = await api.updatePost(post.id, { status: newStatus })
      posts = posts.map((p) => (p.id === post.id ? { ...p, ...updated } : p))
    } catch (err) {
      console.error(err)
    } finally {
      togglingId = null
    }
  }

  async function downloadPost(post: AdminPostSummary) {
    downloadingId = post.id
    try {
      const full = await api.getPost(post.id)
      const sections = [full.content]
      if (full.glossaryEn.length > 0)
        sections.push(`## Glossary\n\n${glossaryToMarkdown(full.glossaryEn)}`)
      if (full.bibliographyEn.length > 0)
        sections.push(`## Bibliography\n\n${bibliographyToMarkdown(full.bibliographyEn)}`)
      const blob = new Blob([sections.join('\n\n')], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${full.slug}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      downloadingId = null
    }
  }
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
      <div class="mb-4 flex items-center gap-1 border-b border-black/10 pb-0 dark:border-white/10">
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
                    : fmtDate(post.updatedAt, 'Updated')}
                </span>
              </div>
              <p class="truncate text-sm font-bold">{post.title}</p>
              {#if post.description}
                <p class="mt-0.5 truncate text-xs text-black/40 dark:text-white/40">
                  {post.description}
                </p>
              {/if}
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <!-- Publish / Unpublish -->
              <button
                onclick={() => toggleStatus(post)}
                disabled={togglingId === post.id}
                title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                class={[
                  'p-1.5 transition-all disabled:opacity-40',
                  post.status === 'published'
                    ? 'text-green-600/50 hover:bg-black/10 hover:text-black dark:text-green-400/50 dark:hover:bg-white/10 dark:hover:text-white'
                    : 'text-black/25 hover:bg-[#FFE600] hover:text-black dark:text-white/25 dark:hover:bg-[#FFE600] dark:hover:text-black',
                ].join(' ')}
              >
                {#if post.status === 'published'}
                  <Archive size={14} />
                {:else}
                  <Send size={14} />
                {/if}
              </button>

              <!-- Download as Markdown -->
              <button
                onclick={() => downloadPost(post)}
                disabled={downloadingId === post.id}
                class="p-1.5 text-black/30 transition-all hover:bg-black hover:text-white disabled:opacity-40 dark:text-white/30 dark:hover:bg-white dark:hover:text-black"
                title="Download as Markdown"
              >
                <Download size={14} />
              </button>

              <!-- Edit -->
              <a
                href="/posts/{post.id}"
                class="p-1.5 text-black/30 transition-all hover:bg-black hover:text-white dark:text-white/30 dark:hover:bg-white dark:hover:text-black"
                title="Edit"
              >
                <Pencil size={14} />
              </a>

              <!-- Delete -->
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
                    if (!confirm(`Delete "${post.title}"?`)) e.preventDefault()
                  }}
                  class="p-1.5 text-black/30 transition-all hover:bg-red-500 hover:text-white dark:text-white/30 dark:hover:bg-red-500 dark:hover:text-white disabled:opacity-40"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
