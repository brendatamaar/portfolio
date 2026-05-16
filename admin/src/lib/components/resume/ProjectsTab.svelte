<script lang="ts">
  import { Loader, Plus, Pencil, Trash2, Check } from 'lucide-svelte'
  import type { Lang, ResumeProjectItem, ProjectDraft } from '$lib/types'
  import { api } from '$lib/api'

  const inputCls = 'w-full border border-black/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white'
  const textareaCls = 'w-full resize-y border border-black/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white'
  const selectCls = 'w-full border border-black/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white'
  const btnPrimary = 'flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/80'
  const btnGhost = 'px-3 py-1.5 font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white'
  const labelCls = 'font-mono text-[10px] font-bold tracking-widest text-black/50 uppercase dark:text-white/50'

  const EMPTY: ProjectDraft = { locale: 'en', title: '', type: 'side_project', company: null, techStack: '', description: '', linkLabel: null, linkHref: null, img: '', isFeatured: 0, sortOrder: 0 }

  let locale = $state<Lang>('en')
  let items = $state<ResumeProjectItem[]>([])
  let loading = $state(true)
  let editingId = $state<number | 'new' | null>(null)
  let draft = $state<ProjectDraft>({ ...EMPTY })
  let saving = $state(false)
  let copying = $state(false)

  async function load(l: Lang) {
    loading = true
    try {
      items = await api.listResumeProjects(l)
    } catch {
      items = []
    } finally {
      loading = false
    }
  }

  $effect(() => { void load(locale) })

  function startAdd() {
    draft = { ...EMPTY, locale }
    editingId = 'new'
  }

  function startEdit(item: ResumeProjectItem) {
    draft = {
      locale: item.locale,
      title: item.title,
      type: item.type,
      company: item.company,
      techStack: item.techStack,
      description: item.description,
      linkLabel: item.linkLabel,
      linkHref: item.linkHref,
      img: item.img,
      isFeatured: item.isFeatured,
      sortOrder: item.sortOrder,
    }
    editingId = item.id
  }

  function setField<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    draft = { ...draft, [key]: value }
  }

  async function handleSave() {
    saving = true
    try {
      if (editingId === 'new') {
        const created = await api.createResumeProject({ ...draft, locale })
        items = [...items, created]
      } else if (editingId !== null) {
        const updated = await api.updateResumeProject(editingId, draft)
        items = items.map((i) => (i.id === editingId ? updated : i))
      }
      editingId = null
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      saving = false
    }
  }

  async function handleDelete(id: number, label: string) {
    if (!confirm(`Delete "${label}"?`)) return
    await api.deleteResumeProject(id)
    items = items.filter((i) => i.id !== id)
  }

  async function handleCopy() {
    const from: Lang = locale === 'id' ? 'en' : 'id'
    if (!confirm(`Copy all ${from.toUpperCase()} entries to ${locale.toUpperCase()}? This will overwrite existing ${locale.toUpperCase()} project entries.`)) return
    copying = true
    try {
      items = await api.copyResumeProjects(from, locale)
    } catch (err) {
      alert(`Copy failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      copying = false
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div class="flex gap-1">
      {#each ['en', 'id'] as l}
        <button
          type="button"
          onclick={() => { locale = l as Lang; editingId = null }}
          class={['px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase transition-colors', locale === l ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white'].join(' ')}
        >{l.toUpperCase()}</button>
      {/each}
    </div>
    <div class="flex gap-2">
      <button onclick={handleCopy} disabled={copying} class={btnGhost}>
        {#if copying}<Loader size={12} class="mr-1 inline animate-spin" />{/if}
        Copy from {locale === 'id' ? 'EN' : 'ID'}
      </button>
      <button onclick={startAdd} class={btnPrimary}><Plus size={12} /> Add</button>
    </div>
  </div>

  {#if loading}
    <p class="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">Loading...</p>
  {:else}
    <div class="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
      {#if editingId === 'new'}
        {@render editForm()}
      {/if}

      {#each items as item (item.id)}
        {#if editingId === item.id}
          {@render editForm()}
        {:else}
          <div class="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold">{item.title} <span class="font-mono text-[10px] text-black/40 dark:text-white/40 uppercase">{item.type === 'side_project' ? 'side project' : 'work'}</span></p>
              <p class="font-mono text-xs text-black/40 dark:text-white/40 truncate">{item.techStack}</p>
            </div>
            <button onclick={() => startEdit(item)} class="p-1.5 text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white"><Pencil size={13} /></button>
            <button onclick={() => handleDelete(item.id, item.title)} class="p-1.5 text-black/30 hover:bg-red-500 hover:text-white dark:text-white/30"><Trash2 size={13} /></button>
          </div>
        {/if}
      {/each}

      {#if items.length === 0 && editingId !== 'new'}
        <div class="px-4 py-6 text-center font-mono text-xs tracking-widest text-black/30 uppercase dark:text-white/30">No entries yet.</div>
      {/if}
    </div>
  {/if}
</div>

{#snippet editForm()}
  <div class="space-y-3 bg-black/5 p-4 dark:bg-white/5">
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1 col-span-2"><label class={labelCls}>Title</label><input class={inputCls} value={draft.title} oninput={(e) => setField('title', (e.target as HTMLInputElement).value)} /></div>
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Type</label>
        <select class={selectCls} value={draft.type} onchange={(e) => setField('type', (e.target as HTMLSelectElement).value as 'side_project' | 'work')}>
          <option value="side_project">Side Project</option>
          <option value="work">Work</option>
        </select>
      </div>
      <div class="flex flex-col gap-1"><label class={labelCls}>Company</label><input class={inputCls} value={draft.company ?? ''} oninput={(e) => setField('company', (e.target as HTMLInputElement).value || null)} /></div>
      <div class="flex flex-col gap-1 col-span-2"><label class={labelCls}>Tech Stack</label><input class={inputCls} value={draft.techStack} placeholder="React, TypeScript, ..." oninput={(e) => setField('techStack', (e.target as HTMLInputElement).value)} /></div>
      <div class="flex flex-col gap-1"><label class={labelCls}>Link Label</label><input class={inputCls} value={draft.linkLabel ?? ''} oninput={(e) => setField('linkLabel', (e.target as HTMLInputElement).value || null)} /></div>
      <div class="flex flex-col gap-1"><label class={labelCls}>Link Href</label><input class={inputCls} value={draft.linkHref ?? ''} oninput={(e) => setField('linkHref', (e.target as HTMLInputElement).value || null)} /></div>
      <div class="flex flex-col gap-1"><label class={labelCls}>Image URL</label><input class={inputCls} value={draft.img} oninput={(e) => setField('img', (e.target as HTMLInputElement).value)} /></div>
      <div class="flex flex-col gap-1"><label class={labelCls}>Sort Order</label><input type="number" class={inputCls} value={draft.sortOrder} oninput={(e) => setField('sortOrder', Number((e.target as HTMLInputElement).value))} /></div>
    </div>
    <div class="flex flex-col gap-1"><label class={labelCls}>Description</label><textarea rows={3} class={textareaCls} value={draft.description} oninput={(e) => setField('description', (e.target as HTMLTextAreaElement).value)}></textarea></div>
    <div class="flex items-center gap-2">
      <input type="checkbox" id="isFeatured" checked={draft.isFeatured === 1} onchange={(e) => setField('isFeatured', (e.target as HTMLInputElement).checked ? 1 : 0)} />
      <label for="isFeatured" class={labelCls}>Featured</label>
    </div>
    <div class="flex gap-2">
      <button type="button" onclick={handleSave} disabled={saving} class={btnPrimary}>{#if saving}<Loader size={12} class="animate-spin" />{:else}<Check size={12} />{/if} Save</button>
      <button type="button" onclick={() => (editingId = null)} class={btnGhost}>Cancel</button>
    </div>
  </div>
{/snippet}
