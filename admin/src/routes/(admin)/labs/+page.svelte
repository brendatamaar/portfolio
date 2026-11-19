<script lang="ts">
  import { Loader, Plus, Trash2, Pencil, Eye, EyeOff, GitBranch } from 'lucide-svelte'
  import type { PageData } from './$types'
  import type { LabItem, LabPayload, LabStatus } from '$lib/types'
  import { api } from '$lib/api'

  let { data }: { data: PageData } = $props()

  let items = $state<LabItem[]>(data.labs)
  let editingId = $state<number | null>(null)
  let repoUrl = $state('')
  let fetching = $state(false)
  let saving = $state(false)
  let error = $state('')

  const blank = (): LabPayload => ({
    slug: '',
    title: '',
    summary: '',
    url: '',
    demoUrl: '',
    coverUrl: null,
    tags: [],
    status: 'live',
    sortOrder: items.length,
    published: false,
  })

  let form = $state<LabPayload>(blank())
  let tagsText = $state('')

  const STATUSES: LabStatus[] = ['live', 'wip', 'archived']
  const field =
    'border border-leader bg-transparent px-3 py-1.5 text-sm focus:border-quiet focus:outline-none dark:border-white/20 dark:focus:border-quiet'

  function reset() {
    editingId = null
    form = blank()
    tagsText = ''
    repoUrl = ''
    error = ''
  }

  function edit(item: LabItem) {
    editingId = item.id
    form = {
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      url: item.url,
      demoUrl: item.demoUrl,
      coverUrl: item.coverUrl,
      tags: item.tags,
      status: item.status,
      sortOrder: item.sortOrder,
      published: item.published,
    }
    tagsText = item.tags.join(', ')
    repoUrl = item.url
    error = ''
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function autofill() {
    if (!repoUrl.trim()) return
    fetching = true
    error = ''
    try {
      const info = await api.labFromGithub(repoUrl.trim())
      form = { ...form, ...info }
      tagsText = info.tags.join(', ')
    } catch {
      error = 'Could not read that GitHub repo.'
    } finally {
      fetching = false
    }
  }

  async function save(e: Event) {
    e.preventDefault()
    saving = true
    error = ''
    const payload: LabPayload = {
      ...form,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    }
    try {
      if (editingId === null) {
        items = [...items, await api.createLab(payload)]
      } else {
        const updated = await api.updateLab(editingId, payload)
        items = items.map((i) => (i.id === updated.id ? updated : i))
      }
      reset()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      error = msg.includes('Slug already exists') ? 'Slug already exists.' : 'Could not save. Check the fields.'
    } finally {
      saving = false
    }
  }

  async function togglePublished(item: LabItem) {
    const { id, resolvedDemoUrl: _r, ...rest } = item
    const updated = await api.updateLab(id, { ...rest, published: !item.published })
    items = items.map((i) => (i.id === id ? updated : i))
  }

  async function remove(item: LabItem) {
    if (!confirm(`Delete "${item.title}"? The deployed demo stays live.`)) return
    await api.deleteLab(item.id)
    items = items.filter((i) => i.id !== item.id)
    if (editingId === item.id) reset()
  }
</script>

<svelte:head>
  <title>Labs — Admin</title>
</svelte:head>

<div class="bg-page text-ink">
  <main class="mx-auto w-full max-w-176 px-4 pt-8 pb-16 sm:px-0">
    <h1 class="text-[16px] text-ink">Labs</h1>
    <p class="mt-1 mb-8 text-[14px] text-quiet">
      Experiments listed on labs.brendatama.dev. Demos live at labs.brendatama.dev/&lt;slug&gt;/ unless a demo URL is set.
    </p>

    <form onsubmit={save} class="mb-10 flex flex-col gap-3">
      <div class="flex gap-2">
        <input bind:value={repoUrl} placeholder="https://github.com/owner/repo" class="{field} min-w-0 flex-1" />
        <button type="button" onclick={autofill} disabled={fetching || !repoUrl.trim()} class="flex items-center gap-1.5 border border-leader px-3 text-[13px] transition-colors hover:text-ink disabled:opacity-40 dark:border-white/20">
          {#if fetching}<Loader size={12} class="animate-spin" />{:else}<GitBranch size={12} />{/if}
          Autofill
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1 text-[12px] text-quiet">Title
          <input required bind:value={form.title} class={field} />
        </label>
        <label class="flex flex-col gap-1 text-[12px] text-quiet">Slug (folder name in labs repo)
          <input required bind:value={form.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" class={field} />
        </label>
      </div>

      <label class="flex flex-col gap-1 text-[12px] text-quiet">Summary
        <textarea rows="2" bind:value={form.summary} class={field}></textarea>
      </label>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1 text-[12px] text-quiet">GitHub URL
          <input bind:value={form.url} class={field} />
        </label>
        <label class="flex flex-col gap-1 text-[12px] text-quiet">Demo URL (empty = labs.brendatama.dev/{form.slug || 'slug'}/)
          <input bind:value={form.demoUrl} placeholder="optional" class={field} />
        </label>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <label class="flex flex-col gap-1 text-[12px] text-quiet">Tags (comma separated)
          <input bind:value={tagsText} class={field} />
        </label>
        <label class="flex flex-col gap-1 text-[12px] text-quiet">Status
          <select bind:value={form.status} class={field}>
            {#each STATUSES as s (s)}<option value={s}>{s}</option>{/each}
          </select>
        </label>
        <label class="flex flex-col gap-1 text-[12px] text-quiet">Order
          <input type="number" bind:value={form.sortOrder} class={field} />
        </label>
      </div>

      <label class="flex flex-col gap-1 text-[12px] text-quiet">Cover image URL (optional)
        <input value={form.coverUrl ?? ''} oninput={(e) => (form.coverUrl = (e.target as HTMLInputElement).value.trim() || null)} class={field} />
      </label>

      <label class="flex items-center gap-2 text-[13px]">
        <input type="checkbox" bind:checked={form.published} /> Published
      </label>

      {#if error}<p class="text-[13px] text-red-500" role="alert">{error}</p>{/if}

      <div class="flex gap-2">
        <button type="submit" disabled={saving} class="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-page transition-opacity hover:opacity-80 disabled:opacity-40">
          {#if saving}<Loader size={12} class="animate-spin" />{:else}<Plus size={12} />{/if}
          {editingId === null ? 'Add lab' : 'Save changes'}
        </button>
        {#if editingId !== null}
          <button type="button" onclick={reset} class="px-3 text-[13px] text-quiet hover:text-ink">Cancel</button>
        {/if}
      </div>
    </form>

    {#if items.length === 0}
      <p class="text-[13px] text-quiet">No labs yet.</p>
    {:else}
      <div class="divide-y divide-black/10 border border-ring dark:divide-white/10 dark:border-white/10">
        {#each items as item (item.id)}
          <div class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised">
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold">{item.title}</p>
              <p class="truncate font-mono text-xs text-quiet">/{item.slug}/ · {item.status}{item.published ? '' : ' · draft'}</p>
            </div>
            <button onclick={() => togglePublished(item)} class="p-1.5 text-quiet hover:text-ink" title={item.published ? 'Unpublish' : 'Publish'}>
              {#if item.published}<Eye size={14} />{:else}<EyeOff size={14} />{/if}
            </button>
            <button onclick={() => edit(item)} class="p-1.5 text-quiet hover:text-ink" title="Edit"><Pencil size={14} /></button>
            <button onclick={() => remove(item)} class="p-1.5 text-quiet transition-all hover:bg-red-500 hover:text-white" title="Delete"><Trash2 size={14} /></button>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
