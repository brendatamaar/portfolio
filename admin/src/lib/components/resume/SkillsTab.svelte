<script lang="ts">
  import { Loader, Plus, Trash2 } from 'lucide-svelte'
  import type { ResumeSkillItem } from '$lib/types'
  import { api } from '$lib/api'

  const inputCls = 'w-full border border-black/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white'
  const btnPrimary = 'flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/80'
  const labelCls = 'font-mono text-[10px] font-bold tracking-widest text-black/50 uppercase dark:text-white/50'

  let items = $state<ResumeSkillItem[]>([])
  let loading = $state(true)
  let adding = $state(false)
  let newName = $state('')
  let newSortOrder = $state(0)

  async function load() {
    loading = true
    try {
      items = await api.listResumeSkills()
    } catch {
      items = []
    } finally {
      loading = false
    }
  }

  $effect(() => { void load() })

  async function handleAdd() {
    if (!newName.trim()) return
    adding = true
    try {
      const created = await api.createResumeSkill(newName.trim(), newSortOrder)
      items = [...items, created]
      newName = ''
      newSortOrder = 0
    } catch (err) {
      alert(`Add failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      adding = false
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await api.deleteResumeSkill(id)
    items = items.filter((i) => i.id !== id)
  }
</script>

<div class="space-y-4">
  {#if loading}
    <p class="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">Loading...</p>
  {:else}
    <div class="space-y-3 bg-black/5 p-4 dark:bg-white/5">
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class={labelCls}>Skill Name</label>
          <input class={inputCls} bind:value={newName} placeholder="e.g. TypeScript" />
        </div>
        <div class="flex flex-col gap-1">
          <label class={labelCls}>Sort Order</label>
          <input type="number" class={inputCls} bind:value={newSortOrder} />
        </div>
      </div>
      <button type="button" onclick={handleAdd} disabled={adding || !newName.trim()} class={btnPrimary}>
        {#if adding}<Loader size={12} class="animate-spin" />{:else}<Plus size={12} />{/if}
        Add Skill
      </button>
    </div>

    <div class="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
      {#each items as item (item.id)}
        <div class="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold">{item.name}</p>
            <p class="font-mono text-xs text-black/40 dark:text-white/40">order: {item.sortOrder}</p>
          </div>
          <button onclick={() => handleDelete(item.id, item.name)} class="p-1.5 text-black/30 hover:bg-red-500 hover:text-white dark:text-white/30"><Trash2 size={13} /></button>
        </div>
      {/each}

      {#if items.length === 0}
        <div class="px-4 py-6 text-center font-mono text-xs tracking-widest text-black/30 uppercase dark:text-white/30">No skills yet.</div>
      {/if}
    </div>
  {/if}
</div>
