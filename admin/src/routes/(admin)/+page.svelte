<script lang="ts">
  import { enhance } from '$app/forms'
  import type { PageData, ActionData } from './$types'
  import type { AdminPostSummary } from '$lib/types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  let posts = $state<AdminPostSummary[]>(data.posts ?? [])
  $effect(() => {
    posts = data.posts ?? []
  })
  let filterStatus = $state<'all' | 'draft' | 'published'>('all')

  let filtered = $derived(
    filterStatus === 'all' ? posts : posts.filter((p) => p.status === filterStatus),
  )

  function fmt(date: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  let deletingId = $state<number | null>(null)
</script>

<svelte:head>
  <title>Posts — Admin</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-6 py-8">
  <div class="mb-8 flex items-center justify-between">
    <h1 class="text-2xl font-black uppercase tracking-tight dark:text-white">Posts</h1>
    <a
      href="/posts/new"
      class="border-2 border-black bg-[#ffe600] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_#000] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0px_#000] dark:shadow-[3px_3px_0px_#fff] dark:hover:shadow-[4px_4px_0px_#fff]"
    >
      + New Post
    </a>
  </div>

  {#if form?.error}
    <div class="mb-4 border-2 border-red-600 bg-red-50 p-3 text-sm font-bold text-red-600">
      {form.error}
    </div>
  {/if}

  <!-- Filter -->
  <div class="mb-6 flex gap-2">
    {#each (['all', 'published', 'draft'] as const) as s}
      <button
        onclick={() => (filterStatus = s)}
        class="border-2 border-black px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors {filterStatus === s
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'bg-white hover:bg-black/5 dark:border-white dark:bg-[#111] dark:text-white dark:hover:bg-white/10'}"
      >
        {s}
      </button>
    {/each}
  </div>

  <div class="border-2 border-black bg-white dark:border-white dark:bg-[#111]">
    {#if filtered.length === 0}
      <p class="p-8 text-center text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
        No posts.
      </p>
    {:else}
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-black bg-[#f5f5f5] dark:border-white dark:bg-[#1a1a1a]">
            <th class="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest dark:text-white">Title</th>
            <th class="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest dark:text-white">Tags</th>
            <th class="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest dark:text-white">Status</th>
            <th class="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest dark:text-white">Published</th>
            <th class="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest dark:text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as post (post.id)}
            <tr class="border-b border-black/10 hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.03]">
              <td class="px-4 py-3 font-medium dark:text-white">{post.title}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  {#each post.tags as tag}
                    <span class="border border-black px-2 py-0.5 text-[10px] font-bold uppercase dark:border-white dark:text-white">{tag.name}</span>
                  {/each}
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest {post.status === 'published'
                    ? 'border border-green-600 bg-green-100 text-green-700'
                    : 'border border-yellow-600 bg-yellow-100 text-yellow-700'}"
                >
                  {post.status}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-black/60 dark:text-white/60">{fmt(post.publishedAt)}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <a
                    href="/posts/{post.id}"
                    class="text-xs font-bold uppercase tracking-widest underline hover:no-underline dark:text-white"
                    >Edit</a
                  >
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
                      class="text-xs font-bold uppercase tracking-widest text-red-600 underline hover:no-underline disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
