<script lang="ts">
  import { Loader, Plus, Pencil, Trash2, Check, X } from 'lucide-svelte'
  import type { Lang, ResumeEducationItem, EduDraft } from '$lib/types'
  import { api } from '$lib/api'
  import { inputCls, textareaCls, btnPrimary, btnGhost, labelCls } from './formStyles'


  const EMPTY: EduDraft = { locale: 'en', school: '', degree: '', start: '', end: '', desc: '', sortOrder: 0 }

  let locale = $state<Lang>('en')
  let items = $state<ResumeEducationItem[]>([])
  let loading = $state(true)
  let editingId = $state<number | 'new' | null>(null)
  let draft = $state<EduDraft>({ ...EMPTY })
  let saving = $state(false)
  let copying = $state(false)

  async function load(l: Lang) {
    loading = true
    try {
      items = await api.listResumeEducation(l)
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

  function startEdit(item: ResumeEducationItem) {
    draft = { locale: item.locale, school: item.school, degree: item.degree, start: item.start, end: item.end, desc: item.desc, sortOrder: item.sortOrder }
    editingId = item.id
  }

  function setField<K extends keyof EduDraft>(key: K, value: EduDraft[K]) {
    draft = { ...draft, [key]: value }
  }

  async function handleSave() {
    saving = true
    try {
      if (editingId === 'new') {
        const created = await api.createResumeEducation({ ...draft, locale })
        items = [...items, created]
      } else if (editingId !== null) {
        const updated = await api.updateResumeEducation(editingId, draft)
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
    await api.deleteResumeEducation(id)
    items = items.filter((i) => i.id !== id)
  }

  async function handleCopy() {
    const from: Lang = locale === 'id' ? 'en' : 'id'
    if (!confirm(`Copy all ${from.toUpperCase()} entries to ${locale.toUpperCase()}? This will overwrite existing ${locale.toUpperCase()} education entries.`)) return
    copying = true
    try {
      items = await api.copyResumeEducation(from, locale)
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
          class={['px-2.5 py-1 text-[12px] font-medium transition-colors', locale === l ? 'bg-ink text-page' : 'text-quiet hover:text-ink/30 dark:hover:text-ink'].join(' ')}
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
    <p class="text-[13px] text-quiet dark:text-quiet">Loading...</p>
  {:else}
    <div class="divide-y divide-black/10 border border-ring dark:divide-white/10 dark:border-white/10">
      {#if editingId === 'new'}
        <div class="space-y-3 bg-raised p-4 dark:bg-white/5">
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1"><label class={labelCls}>School</label><input class={inputCls} value={draft.school} oninput={(e) => setField('school', (e.target as HTMLInputElement).value)} /></div>
            <div class="flex flex-col gap-1"><label class={labelCls}>Degree</label><input class={inputCls} value={draft.degree} oninput={(e) => setField('degree', (e.target as HTMLInputElement).value)} /></div>
            <div class="flex flex-col gap-1"><label class={labelCls}>Start</label><input class={inputCls} value={draft.start} placeholder="2018" oninput={(e) => setField('start', (e.target as HTMLInputElement).value)} /></div>
            <div class="flex flex-col gap-1"><label class={labelCls}>End</label><input class={inputCls} value={draft.end} placeholder="2022" oninput={(e) => setField('end', (e.target as HTMLInputElement).value)} /></div>
            <div class="flex flex-col gap-1 col-span-2"><label class={labelCls}>Sort Order</label><input type="number" class={inputCls} value={draft.sortOrder} oninput={(e) => setField('sortOrder', Number((e.target as HTMLInputElement).value))} /></div>
          </div>
          <div class="flex flex-col gap-1"><label class={labelCls}>Description</label><textarea rows={2} class={textareaCls} value={draft.desc} oninput={(e) => setField('desc', (e.target as HTMLTextAreaElement).value)}></textarea></div>
          <div class="flex gap-2">
            <button type="button" onclick={handleSave} disabled={saving} class={btnPrimary}>{#if saving}<Loader size={12} class="animate-spin" />{:else}<Check size={12} />{/if} Save</button>
            <button type="button" onclick={() => (editingId = null)} class={btnGhost}>Cancel</button>
          </div>
        </div>
      {/if}

      {#each items as item (item.id)}
        {#if editingId === item.id}
          <div class="space-y-3 bg-raised p-4 dark:bg-white/5">
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1"><label class={labelCls}>School</label><input class={inputCls} value={draft.school} oninput={(e) => setField('school', (e.target as HTMLInputElement).value)} /></div>
              <div class="flex flex-col gap-1"><label class={labelCls}>Degree</label><input class={inputCls} value={draft.degree} oninput={(e) => setField('degree', (e.target as HTMLInputElement).value)} /></div>
              <div class="flex flex-col gap-1"><label class={labelCls}>Start</label><input class={inputCls} value={draft.start} placeholder="2018" oninput={(e) => setField('start', (e.target as HTMLInputElement).value)} /></div>
              <div class="flex flex-col gap-1"><label class={labelCls}>End</label><input class={inputCls} value={draft.end} placeholder="2022" oninput={(e) => setField('end', (e.target as HTMLInputElement).value)} /></div>
              <div class="flex flex-col gap-1 col-span-2"><label class={labelCls}>Sort Order</label><input type="number" class={inputCls} value={draft.sortOrder} oninput={(e) => setField('sortOrder', Number((e.target as HTMLInputElement).value))} /></div>
            </div>
            <div class="flex flex-col gap-1"><label class={labelCls}>Description</label><textarea rows={2} class={textareaCls} value={draft.desc} oninput={(e) => setField('desc', (e.target as HTMLTextAreaElement).value)}></textarea></div>
            <div class="flex gap-2">
              <button type="button" onclick={handleSave} disabled={saving} class={btnPrimary}>{#if saving}<Loader size={12} class="animate-spin" />{:else}<Check size={12} />{/if} Save</button>
              <button type="button" onclick={() => (editingId = null)} class={btnGhost}>Cancel</button>
            </div>
          </div>
        {:else}
          <div class="flex items-center gap-3 px-4 py-3 hover:bg-raised">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold">{item.school} <span class="font-normal text-quiet">— {item.degree}</span></p>
              <p class="font-mono text-xs text-quiet">{item.start}–{item.end}</p>
            </div>
            <button onclick={() => startEdit(item)} class="p-1.5 text-quiet hover:text-ink/30 dark:hover:text-ink"><Pencil size={13} /></button>
            <button onclick={() => handleDelete(item.id, item.school)} class="p-1.5 text-quiet hover:bg-red-500 hover:text-white dark:text-quiet"><Trash2 size={13} /></button>
          </div>
        {/if}
      {/each}

      {#if items.length === 0 && editingId !== 'new'}
        <div class="px-4 py-6 text-center text-[13px] text-quiet dark:text-quiet">No entries yet.</div>
      {/if}
    </div>
  {/if}
</div>
