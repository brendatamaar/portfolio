<script lang="ts">
  import { Loader, Plus, Pencil, Trash2, Check, Upload, Star, X, ExternalLink, GripVertical, ChevronUp, ChevronDown, ArrowDownAZ } from 'lucide-svelte'
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
  const imgSrc = $derived(draft.img ? (draft.img.startsWith('/') ? API_ORIGIN + draft.img : draft.img) : '')

  // Tech stack is stored server-side as JSON ('["Go","React"]'); never show
  // that raw. Everywhere in this tab it is a string[] of pills.
  function parseTech(raw: string): string[] {
    try {
      const v: unknown = JSON.parse(raw)
      if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
    } catch { /* not JSON: fall through to comma list */ }
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  const techChips = $derived(parseTech(draft.techStack))
  let techInput = $state('')
  const techSuggestions = $derived(
    [...new Set(items.flatMap((i) => parseTech(i.techStack)))]
      .filter((t) => !techChips.some((c) => c.toLowerCase() === t.toLowerCase()))
      .slice(0, 8),
  )
  function setTech(chips: string[]) { setField('techStack', chips.join(', ')) }
  function addTech(raw: string) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
    if (!parts.length) return
    const next = [...techChips]
    for (const p of parts) if (!next.some((c) => c.toLowerCase() === p.toLowerCase())) next.push(p)
    setTech(next); techInput = ''
  }
  function removeTech(chip: string) { setTech(techChips.filter((c) => c !== chip)) }

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
    techInput = ''
    openDraft({ locale: item.locale, title: item.title, type: item.type, company: item.company, techStack: parseTech(item.techStack).join(', '), description: item.description, linkLabel: item.linkLabel, linkHref: item.linkHref, img: item.img, isFeatured: item.isFeatured, sortOrder: item.sortOrder }, item.id)
  }

  // --- Ordering: drag-and-drop / arrows / A-Z, persisted via /projects/reorder.
  // sortOrder is always rewritten to the row position (0..n-1) automatically.
  let dragId = $state<number | null>(null)
  let overId = $state<number | null>(null)
  let reordering = $state(false)

  async function persistOrder(next: ResumeProjectItem[]) {
    const prev = items
    items = next.map((i, idx) => ({ ...i, sortOrder: idx }))
    reordering = true; error = ''
    try {
      items = await api.reorderResumeProjects(locale, items.map((i) => i.id))
    } catch (err) {
      items = prev
      error = `Reorder failed: ${err instanceof Error ? err.message : String(err)}`
    } finally { reordering = false }
  }
  function moveItem(id: number, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id)
    const to = idx + dir
    if (idx < 0 || to < 0 || to >= items.length) return
    const next = [...items]; [next[idx], next[to]] = [next[to], next[idx]]
    void persistOrder(next)
  }
  function dropOn(targetId: number) {
    if (dragId === null || dragId === targetId) return
    const from = items.findIndex((i) => i.id === dragId)
    const to = items.findIndex((i) => i.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...items]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved)
    void persistOrder(next)
  }
  function sortAZ() { void persistOrder([...items].sort((a, b) => a.title.localeCompare(b.title))) }
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
    if (techInput.trim()) addTech(techInput)
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
    try {
      await api.deleteResumeProject(id)
      const rest = items.filter((i) => i.id !== id)
      if (rest.length) void persistOrder(rest)
      else items = rest
    }
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
    <div class="flex flex-wrap gap-2">
      <button onclick={sortAZ} disabled={reordering || items.length < 2} class={btnGhost} title="Sort all projects A–Z and save that order"><ArrowDownAZ size={13} class="mr-1 inline" />Sort A–Z</button>
      <button onclick={handleCopy} disabled={copying} class={btnGhost}>{#if copying}<Loader size={12} class="mr-1 inline animate-spin" />{/if}Copy from {locale === 'id' ? 'EN' : 'ID'}</button>
      <button onclick={startAdd} disabled={editingId === 'new'} class={btnPrimary}><Plus size={12} /> Add project</button>
    </div>
  </div>

  {#if error}<p role="alert" class="border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>{/if}
  {#if notice && !error}<p role="status" class="border border-green-600/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">{notice}</p>{/if}

  {#if loading}
    <div class="space-y-2" aria-label="Loading projects">{#each [1, 2, 3] as i (i)}<div class="h-14 animate-pulse border border-ring bg-raised dark:border-white/10 dark:bg-white/5"></div>{/each}</div>
  {:else}
    {#if items.length > 1}<p class="text-[12px] text-quiet">Drag the handle (or use ↑ ↓) to reorder — order saves automatically and numbers renumber themselves.{#if reordering} <span class="text-ink">Saving order…</span>{/if}</p>{/if}
    <div class="divide-y divide-black/10 border border-ring dark:divide-white/10 dark:border-white/10">
      {#if editingId === 'new'}{@render editForm()}{/if}
      {#each items as item, idx (item.id)}
        {#if editingId === item.id}{@render editForm()}
        {:else}
          <div
            class="flex items-center gap-2 px-3 py-3 transition-colors hover:bg-raised sm:gap-3 sm:px-4 {overId === item.id && dragId !== null && dragId !== item.id ? 'bg-hl' : ''} {dragId === item.id ? 'opacity-40' : ''}"
            ondragover={(e) => { e.preventDefault(); overId = item.id }}
            ondragleave={() => { if (overId === item.id) overId = null }}
            ondrop={(e) => { e.preventDefault(); dropOn(item.id); dragId = null; overId = null }}
          >
            <button type="button" draggable="true" ondragstart={(e) => { dragId = item.id; e.dataTransfer?.setData('text/plain', String(item.id)); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move' }} ondragend={() => { dragId = null; overId = null }} aria-label={`Drag to reorder ${item.title}`} title="Drag to reorder" class="shrink-0 cursor-grab touch-none p-1 text-quiet hover:text-ink active:cursor-grabbing"><GripVertical size={15} /></button>
            <span class="w-5 shrink-0 text-center font-mono text-[11px] text-quiet" title="Position (automatic)">{idx + 1}</span>
            {#if item.img}<img src={item.img.startsWith('/') ? API_ORIGIN + item.img : item.img} alt="" loading="lazy" decoding="async" class="h-11 w-16 shrink-0 border border-ring object-cover object-top dark:border-white/10" />{/if}
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-2 text-sm font-bold">{item.title}
                <span class="px-1.5 py-0.5 text-[11px] font-medium {item.type === 'work' ? 'bg-ink text-page' : 'bg-raised text-quiet dark:bg-white/10 dark:text-white/50'}">{item.type === 'side_project' ? 'Side project' : 'Work'}</span>
                {#if item.isFeatured}<span class="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400"><Star size={10} fill="currentColor" /> Featured</span>{/if}
              </p>
              <div class="mt-1 flex flex-wrap items-center gap-1">
                {#each parseTech(item.techStack).slice(0, 5) as tech (tech)}<span class="rounded-full border border-ring px-1.5 py-px font-mono text-[10px] text-quiet">{tech}</span>{/each}
                {#if parseTech(item.techStack).length > 5}<span class="font-mono text-[10px] text-quiet">+{parseTech(item.techStack).length - 5}</span>{/if}
                {#if item.company}<span class="font-mono text-[10px] text-quiet">· {item.company}</span>{/if}
              </div>
            </div>
            <div class="flex shrink-0 flex-col">
              <button onclick={() => moveItem(item.id, -1)} disabled={idx === 0 || reordering} aria-label={`Move ${item.title} up`} class="p-0.5 text-quiet hover:text-ink disabled:opacity-25"><ChevronUp size={13} /></button>
              <button onclick={() => moveItem(item.id, 1)} disabled={idx === items.length - 1 || reordering} aria-label={`Move ${item.title} down`} class="p-0.5 text-quiet hover:text-ink disabled:opacity-25"><ChevronDown size={13} /></button>
            </div>
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
        <div class="flex flex-wrap items-center gap-1.5 rounded-lg border border-ring bg-transparent px-2 py-1.5 transition-colors focus-within:border-quiet">
          {#each techChips as chip (chip)}
            <span class="flex items-center gap-1 rounded-full bg-raised py-0.5 pr-1 pl-2.5 text-[12px] text-ink">{chip}<button type="button" onclick={() => removeTech(chip)} aria-label={`Remove ${chip}`} class="p-0.5 text-quiet hover:text-rose"><X size={11} /></button></span>
          {/each}
          <input
            id="proj-stack"
            bind:value={techInput}
            placeholder={techChips.length ? 'Add another…' : 'Type a tech and press Enter'}
            class="min-w-36 flex-1 bg-transparent px-1 py-0.5 text-sm text-ink outline-none placeholder:text-quiet/60"
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTech(techInput) }
              else if (e.key === 'Backspace' && !techInput && techChips.length) removeTech(techChips[techChips.length - 1])
            }}
            onpaste={(e) => { const t = e.clipboardData?.getData('text') ?? ''; if (t.includes(',')) { e.preventDefault(); addTech(t) } }}
            onblur={() => { if (techInput.trim()) addTech(techInput) }}
          />
        </div>
        <span class="text-[11px] text-quiet">Enter or comma adds a pill · paste a comma list to add many · Backspace removes the last.</span>
        {#if techSuggestions.length}
          <div class="flex flex-wrap items-center gap-1 pt-0.5">
            <span class="text-[11px] text-quiet">Used before:</span>
            {#each techSuggestions as s (s)}<button type="button" onclick={() => addTech(s)} class="rounded-full border border-dotted border-leader px-2 py-px text-[11px] text-quiet transition-colors hover:border-quiet hover:text-ink">+ {s}</button>{/each}
          </div>
        {/if}
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
      <div class="flex flex-col gap-1">
        <span class={labelCls}>Position</span>
        <p class="flex h-full items-center text-[13px] text-quiet">{editingId === 'new' ? `Last — #${items.length + 1} of ${items.length + 1}` : `#${items.findIndex((i) => i.id === editingId) + 1} of ${items.length}`} <span class="ml-1 hidden sm:inline">(automatic — drag rows to change)</span></p>
      </div>
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
