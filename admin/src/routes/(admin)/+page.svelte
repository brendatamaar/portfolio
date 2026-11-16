<script lang="ts">
  import { untrack } from 'svelte'
  import { enhance } from '$app/forms'
  import { Send, Archive, Download, Pencil, Trash2 } from 'lucide-svelte'
  import type { PageData, ActionData } from './$types'
  import type { AdminPostSummary } from '$lib/types'
  import { fmtDate, glossaryToMarkdown, bibliographyToMarkdown } from '$lib/utils'
  import { api } from '$lib/api'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  // Keyed by server data identity only via untrack init; local optimistic
  // updates (toggle/delete) own the list after mount. SvelteKit remounts
  // on navigation, so a sync $effect is unnecessary and would clobber them.
  let posts = $state<AdminPostSummary[]>(untrack(() => data.posts ?? []))
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

<div class="mx-auto w-full max-w-176 px-4 pt-8 pb-16 sm:px-0">
  <h1 class="text-[16px] text-ink">Posts</h1>
  <p class="mt-1 text-[14px] text-quiet">{posts.length} {posts.length === 1 ? 'post' : 'posts'} · {counts.published} published · {counts.draft} draft</p>

    {#if form?.error}
      <div class="mt-4 rounded-lg border border-rose/40 bg-rose/10 px-3 py-2 text-[13px] text-rose" role="alert">{form.error}</div>
    {/if}

    {#if posts.length > 0}
      <div class="mt-8 mb-2 flex items-center gap-4 text-[14px]" role="tablist" aria-label="Filter posts">
        {#each tabs as tab}
          <button role="tab" aria-selected={filterStatus === tab.key} onclick={() => (filterStatus = tab.key)} class="transition-colors {filterStatus === tab.key ? 'font-medium text-ink' : 'text-quiet hover:text-ink'}">
            {tab.label} <span class="text-quiet">{tab.count}</span>
          </button>
        {/each}
      </div>
    {/if}

    {#if filtered.length === 0}
      <p class="pt-6 text-[14px] text-quiet">
        {posts.length === 0 ? 'No posts yet.' : `No ${filterStatus} posts.`}
        {#if posts.length === 0}<a href="/posts/new" class="border-b border-leader font-medium text-ink hover:border-ink">Write your first post</a>{/if}
      </p>
    {:else}
      <ul class="rows-dim">
        {#each filtered as post (post.id)}
          <li class="group flex items-center gap-3 py-1.5 text-[14px] leading-[1.7]">
            <a href="/posts/{post.id}" class="min-w-0 truncate text-body transition-colors group-hover:text-ink" title={post.description || post.title}>{post.title}</a>
            <span class="min-w-6 flex-1 -translate-y-px border-b border-dotted border-leader transition-colors group-hover:border-quiet" aria-hidden="true"></span>
            <span class="hidden shrink-0 text-quiet sm:block {post.status === 'published' ? '' : 'text-cord'}">{post.status === 'published' ? (post.publishedAt ? fmtDate(post.publishedAt, '') : 'Published') : 'Draft'}</span>
            <span class="hidden shrink-0 text-quiet md:block">{fmtDate(post.updatedAt, '')}</span>

            <div class="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
              <!-- Publish / Unpublish -->
              <button
                onclick={() => toggleStatus(post)}
                disabled={togglingId === post.id}
                title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                class={[
                  'p-1.5 transition-all disabled:opacity-40',
                  post.status === 'published'
                    ? 'text-green-600/50 hover:bg-raised hover:text-ink dark:text-green-400/50 dark:hover:bg-white/10 dark:hover:text-ink'
                    : 'text-quiet hover:bg-pen hover:text-ink/25 dark:hover:bg-pen dark:hover:text-ink',
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
                class="p-1.5 text-quiet transition-all hover:bg-ink hover:text-white disabled:opacity-40 dark:text-quiet dark:hover:bg-page dark:hover:text-ink"
                title="Download as Markdown"
              >
                <Download size={14} />
              </button>

              <!-- Edit -->
              <a
                href="/posts/{post.id}"
                class="p-1.5 text-quiet transition-all hover:bg-ink hover:text-white dark:text-quiet dark:hover:bg-page dark:hover:text-ink"
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
                  class="p-1.5 text-quiet transition-all hover:bg-red-500 hover:text-white dark:text-quiet dark:hover:bg-red-500 dark:hover:text-ink disabled:opacity-40"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
</div>
