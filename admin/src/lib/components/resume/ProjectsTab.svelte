<script lang="ts">
  import { Loader, Plus, Pencil, Trash2, Check, Upload, Star, X, ExternalLink } from 'lucide-svelte'
  import type { Lang, ResumeProjectItem, ProjectDraft } from '$lib/types'
  import { api } from '$lib/api'
  import { inputCls, textareaCls, selectCls, btnPrimary, btnGhost, labelCls } from './formStyles'

  // Admin origin has no /uploads route; stored paths are relative to the API origin.
  const API_ORIGIN = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
  const EMPTY: ProjectDraft = { locale: 'en', title: '', type: 'side_project', company: null, techStack: '', description: '', linkLabel: null, linkHref: null, img: '', isFeatured: 0, sortOrder: 0 }

  let locale = $state<Lang>('en')
  let items = $state<ResumeProjectItem[]>([])
  let loading = $state(true)
  let editingId = $state<number | 'new' | null>(null)
  let draft = $state<ProjectDraft>({ ...EMPTY })
  let snapshot = $state('')
  let saving = $state(false)
  let copying = $state(false)
  let uploading = $state(false)
  let error = $state('')
  let notice = $state('')
  let titleEl = $state<HTMLInputElement | null>(null)

  const isDirty = $derived(editingId !== null && JSON.stringify(draft) !== snapshot)
  const titleError = $derived(editingId !== null && !draft.title.trim() ? 'Title is required.' : '')
  const hrefError = $derived(
    draft.linkHref && !/^https?:\/\//i.test(draft.linkHref) && !draft.linkHref.startsWith('/')
      ? 'Use a full https:// URL or a /relative path.'
      : '',
  )
  const canSave = $derived(!titleError && !hrefError && !saving)
  const techChips = $derived(draft.techStack.split(',').map((s) => s.trim()).filter(Boolean))
  const imgSrc = $derived(draft.img ? (draft.img.startsWith('/') ? API_ORIGIN + draft.img : draft.img) : '')

  async function load(l: Lang) {
    loading = true
    try { items = await api.listResumeProjects(l) } catch { items = [] } finally { loading = false }
  }
  $effect(() => { void load(locale) })
  $effect(() => { if (editingId !== null) titleEl?.focus() })

  function openDraft(next: ProjectDraft, id: number | 'new') {
    draft = next; snapshot = JSON.stringify(next); editingId = id; error = ''; notice = ''
  }
  function startAdd() { openDraft({ ...EMPTY, locale, sortOrder: items.length }, 'new') }
  function startEdit(item: ResumeProjectItem) {
    openDraft({ locale: item.locale, title: item.title, type: item.type, company: item.company, techStack: item.techStack, description: item.description, linkLabel: item.linkLabel, linkHref: item.linkHref, img: item.img, isFeatured: item.isFeatured, sortOrder: item.sortOrder }, item.id)
  }
  function setField<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) { draft = { ...draft, [key]: value } }
  function cancel() {
    if (isDirty && !confirm('Discard unsaved changes?')) return
    editingId = null; error = ''
  }

  async function handleUpload(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    uploading = true; error = ''
    try { setField('img', (await api.uploadImage(file)).url) }
    catch (err) { error = `Upload failed: ${err instanceof Error ? err.message : String(err)}` }
    finally { uploading = false; input.value = '' }
  }

  async function handleSave() {
    if (!canSave) { error = titleError || hrefError; return }
    saving = true; error = ''
    try {
      if (editingId === 'new') { items = [...items, await api.createResumeProject({ ...draft, locale })]; notice = `“${draft.title.trim()}” added.` }
      else if (editingId !== null) {
        const updated = await api.updateResumeProject(editingId, draft)
        items = items.map((i) => (i.id === editingId ? updated : i)); notice = `“${draft.title.trim()}” saved.`
      }
      editingId = null
    } catch (err) { error = `Save failed: ${err instanceof Error ? err.message : String(err)}` }
    finally { saving = false }
  }

  async function handleDelete(id: number, label: string) {
    if (!confirm(`Delete "${label}"?`)) return
    try { await api.deleteResumeProject(id); items = items.filter((i) => i.id !== id) }
    catch (err) { error = `Delete failed: ${err instanceof Error ? err.message : String(err)}` }
  }

  async function handleCopy() {
    const from: Lang = locale === 'id' ? 'en' : 'id'
    if (!confirm(`Copy all ${from.toUpperCase()} entries to ${locale.toUpperCase()}? This overwrites existing ${locale.toUpperCase()} entries.`)) return
    copying = true; error = ''
    try { items = await api.copyResumeProjects(from, locale); notice = `Copied from ${from.toUpperCase()}.` }
    catch (err) { error = `Copy failed: ${err instanceof Error ? err.message : String(err)}` }
    finally { copying = false }
  }
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex gap-1" role="tablist" aria-label="Language">
      {#each ['en', 'id'] as l}
        <button type="button" role="tab" aria-selected={locale === l} onclick={() => { if (isDirty && !confirm('Discard unsaved changes?')) return; locale = l as Lang; editingId = null }} class={['px-2.5 py-1 text-[12px] font-medium transition-colors', locale === l ? 'bg-ink text-page' : 'text-quiet hover:text-ink/30 dark:hover:text-ink'].join(' ')}>{l.toUpperCase()}</button>
      {/each}
    </div>
    <div class="flex gap-2">
      <button onclick={handleCopy} disabled={copying} class={btnGhost}>{#if copying}<Loader size={12} class="mr-1 inline animate-spin" />{/if}Copy from {locale === 'id' ? 'EN' : 'ID'}</button>
      <button onclick={startAdd} disabled={editingId === 'new'} class={btnPrimary}><Plus size={12} /> Add project</button>
    </div>
  </div>

  {#if error}<p role="alert" class="border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>{/if}
  {#if notice && !error}<p role="status" class="border border-green-600/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">{notice}</p>{/if}

  {#if loading}
    <div class="space-y-2" aria-label="Loading projects">{#each [1, 2, 3] as i (i)}<div class="h-14 animate-pulse border border-ring bg-raised dark:border-white/10 dark:bg-white/5"></div>{/each}</div>
  {:else}
    <div class="divide-y divide-black/10 border border-ring dark:divide-white/10 dark:border-white/10">
      {#if editingId === 'new'}{@render editForm()}{/if}
      {#each items as item (item.id)}
        {#if editingId === item.id}{@render editForm()}
        {:else}
          <div class="flex items-center gap-3 px-4 py-3 hover:bg-raised">
            {#if item.img}<img src={item.img.startsWith('/') ? API_ORIGIN + item.img : item.img} alt="" loading="lazy" decoding="async" class="h-11 w-16 shrink-0 border border-ring object-cover object-top dark:border-white/10" />{/if}
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-2 text-sm font-bold">{item.title}
                <span class="px-1.5 py-0.5 text-[11px] font-medium {item.type === 'work' ? 'bg-ink text-page' : 'bg-raised text-quiet dark:bg-white/10 dark:text-white/50'}">{item.type === 'side_project' ? 'Side project' : 'Work'}</span>
                {#if item.isFeatured}<span class="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"><Star size={10} fill="currentColor" /> Featured</span>{/if}
              </p>
              <p class="truncate font-mono text-xs text-quiet">{item.techStack || '—'}{item.company ? ` · ${item.company}` : ''}</p>
            </div>
            <span class="hidden font-mono text-[11px] text-quiet sm:block dark:text-white/25">#{item.sortOrder}</span>
            <button onclick={() => startEdit(item)} aria-label={`Edit ${item.title}`} class="p-1.5 text-quiet hover:text-ink/30 dark:hover:text-ink"><Pencil size={13} /></button>
            <button onclick={() => handleDelete(item.id, item.title)} aria-label={`Delete ${item.title}`} class="p-1.5 text-quiet hover:bg-red-500 hover:text-white dark:text-quiet"><Trash2 size={13} /></button>
          </div>
        {/if}
      {/each}
      {#if items.length === 0 && editingId !== 'new'}
        <div class="px-4 py-10 text-center">
          <p class="text-[13px] text-quiet dark:text-quiet">No projects in {locale.toUpperCase()} yet.</p>
          <button onclick={startAdd} class="{btnPrimary} mx-auto mt-3"><Plus size={12} /> Add your first project</button>
        </div>
      {/if}
    </div>
  {/if}
</div>

{#snippet editForm()}
  <form class="space-y-4 bg-raised p-4 sm:p-5 " onsubmit={(e) => { e.preventDefault(); void handleSave() }} onkeydown={(e) => { if (e.key === 'Escape') cancel() }}>
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-medium tracking-tight">{editingId === 'new' ? 'New project' : `Edit — ${draft.title || 'project'}`}</h3>
      <span class="text-[12px] {isDirty ? 'text-amber-600 dark:text-amber-400' : 'text-quiet'}">{isDirty ? '● Unsaved changes' : 'No changes'}</span>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div class="flex flex-col gap-1 sm:col-span-2">
        <label class={labelCls} for="proj-title">Title <span class="text-red-500">*</span></label>
        <input id="proj-title" bind:this={titleEl} class="{inputCls} {titleError ? 'border-red-500' : ''}" value={draft.title} placeholder="e.g. Portfolio CMS" aria-invalid={!!titleError} oninput={(e) => setField('title', (e.target as HTMLInputElement).value)} />
        {#if titleError}<span class="text-[11px] text-red-500">{titleError}</span>{/if}
      </div>
      <div class="flex flex-col gap-1">
        <label class={labelCls} for="proj-type">Type</label>
        <select id="proj-type" class={selectCls} value={draft.type} onchange={(e) => setField('type', (e.target as HTMLSelectElement).value as 'side_project' | 'work')}><option value="side_project">Side Project</option><option value="work">Work</option></select>
      </div>
      <div class="flex flex-col gap-1"><label class={labelCls} for="proj-company">Company <span class="normal-case opacity-60">(work only)</span></label><input id="proj-company" class={inputCls} value={draft.company ?? ''} placeholder="Company name" oninput={(e) => setField('company', (e.target as HTMLInputElement).value || null)} /></div>
      <div class="flex flex-col gap-1 sm:col-span-2">
        <label class={labelCls} for="proj-stack">Tech stack</label>
        <input id="proj-stack" class={inputCls} value={draft.techStack} placeholder="SvelteKit, TypeScript, SQLite" oninput={(e) => setField('techStack', (e.target as HTMLInputElement).value)} />
        {#if techChips.length}<div class="flex flex-wrap gap-1 pt-0.5">{#each techChips as chip (chip)}<span class="border border-ring px-1.5 py-0.5 font-mono text-[11px] dark:border-white/15">{chip}</span>{/each}</div>{/if}
      </div>
      <div class="flex flex-col gap-1"><label class={labelCls} for="proj-linklabel">Link label</label><input id="proj-linklabel" class={inputCls} value={draft.linkLabel ?? ''} placeholder="View live" oninput={(e) => setField('linkLabel', (e.target as HTMLInputElement).value || null)} /></div>
      <div class="flex flex-col gap-1">
        <label class={labelCls} for="proj-linkhref">Link URL</label>
        <input id="proj-linkhref" class="{inputCls} {hrefError ? 'border-red-500' : ''}" value={draft.linkHref ?? ''} placeholder="https://…" inputmode="url" oninput={(e) => setField('linkHref', (e.target as HTMLInputElement).value || null)} />
        {#if hrefError}<span class="text-[11px] text-red-500">{hrefError}</span>{/if}
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <label class={labelCls} for="proj-desc">Description</label>
      <textarea id="proj-desc" rows={4} class={textareaCls} value={draft.description} placeholder="What it does, your role, and the outcome — 1–3 sentences." oninput={(e) => setField('description', (e.target as HTMLTextAreaElement).value)}></textarea>
      <span class="self-end font-mono text-[11px] text-quiet">{draft.description.length} chars</span>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
      <div class="flex flex-col gap-1">
        <span class={labelCls}>Cover image</span>
        <div class="flex gap-2">
          <input class={inputCls} value={draft.img} placeholder="Paste URL or upload →" aria-label="Image URL" oninput={(e) => setField('img', (e.target as HTMLInputElement).value)} />
          <label class="{btnPrimary} shrink-0 cursor-pointer">{#if uploading}<Loader size={12} class="animate-spin" />{:else}<Upload size={12} />{/if}<span class="hidden sm:inline">Upload</span><input type="file" accept="image/*" class="hidden" disabled={uploading} onchange={handleUpload} /></label>
          {#if draft.img}<button type="button" onclick={() => setField('img', '')} aria-label="Remove image" class="shrink-0 p-1.5 text-quiet hover:text-red-500 dark:text-quiet"><X size={14} /></button>{/if}
        </div>
        {#if imgSrc}<img src={imgSrc} alt="Project preview" loading="lazy" class="mt-1 aspect-video w-full max-w-sm border border-ring object-cover object-top dark:border-white/10" />{/if}
      </div>
      <div class="flex flex-col gap-1"><label class={labelCls} for="proj-sort">Sort order</label><input id="proj-sort" type="number" class="{inputCls} sm:w-24" value={draft.sortOrder} oninput={(e) => setField('sortOrder', Number((e.target as HTMLInputElement).value))} /></div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-ring pt-3 dark:border-white/10">
      <button type="button" role="switch" aria-checked={draft.isFeatured === 1} onclick={() => setField('isFeatured', draft.isFeatured === 1 ? 0 : 1)} class="flex items-center gap-2">
        <span class="flex h-5 w-9 items-center px-0.5 transition-colors {draft.isFeatured === 1 ? 'justify-end bg-ink dark:bg-page' : 'bg-leader dark:bg-white/20'}"><span class="h-4 w-4 bg-page dark:bg-ink"></span></span>
        <span class={labelCls}>Featured on homepage</span>
      </button>
      <div class="flex gap-2">
        <button type="button" onclick={cancel} class={btnGhost}>Cancel <span class="opacity-50">(Esc)</span></button>
        <button type="submit" disabled={!canSave} class={btnPrimary}>{#if saving}<Loader size={12} class="animate-spin" />{:else}<Check size={12} />{/if}{editingId === 'new' ? 'Add project' : 'Save changes'}</button>
      </div>
    </div>
    {#if draft.linkHref && !hrefError}<a href={draft.linkHref} target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-[12px] text-quiet hover:text-ink/40 dark:hover:text-ink"><ExternalLink size={10} /> Test link</a>{/if}
  </form>
{/snippet}
