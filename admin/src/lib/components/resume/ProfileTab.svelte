<script lang="ts">
  import { Check, Loader } from 'lucide-svelte'
  import type { Lang, ResumeProfile } from '$lib/types'
  import { api } from '$lib/api'

  const inputCls = 'w-full border border-black/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white'
  const textareaCls = 'w-full resize-y border border-black/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white'
  const btnPrimary = 'flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/80'
  const labelCls = 'font-mono text-[10px] font-bold tracking-widest text-black/50 uppercase dark:text-white/50'

  let locale = $state<Lang>('en')
  let form = $state<Partial<ResumeProfile>>({})
  let loading = $state(true)
  let saving = $state(false)
  let saved = $state(false)

  async function load(l: Lang) {
    loading = true
    try {
      form = (await api.getResumeProfile(l)) ?? {}
    } catch {
      form = {}
    } finally {
      loading = false
    }
  }

  $effect(() => {
    void load(locale)
  })

  function set(key: keyof ResumeProfile, value: string) {
    form = { ...form, [key]: value }
    saved = false
  }

  async function handleSave(e: SubmitEvent) {
    e.preventDefault()
    saving = true
    try {
      await api.updateResumeProfile(locale, form)
      saved = true
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      saving = false
    }
  }
</script>

{#if loading}
  <p class="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">Loading...</p>
{:else}
  <form onsubmit={handleSave} class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex gap-1">
        {#each ['en', 'id'] as l}
          <button
            type="button"
            onclick={() => { locale = l as Lang; saved = false }}
            class={[
              'px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase transition-colors',
              locale === l
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white',
            ].join(' ')}
          >
            {l.toUpperCase()}
          </button>
        {/each}
      </div>
      <button type="submit" disabled={saving} class={btnPrimary}>
        {#if saving}<Loader size={12} class="animate-spin" />{:else}<Check size={12} />{/if}
        {saved ? 'Saved' : 'Save'}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Name</label>
        <input class={inputCls} value={form.name ?? ''} oninput={(e) => set('name', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Current Job</label>
        <input class={inputCls} value={form.currentJob ?? ''} oninput={(e) => set('currentJob', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Location</label>
        <input class={inputCls} value={form.location ?? ''} oninput={(e) => set('location', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Location Link</label>
        <input class={inputCls} value={form.locationLink ?? ''} oninput={(e) => set('locationLink', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Email</label>
        <input class={inputCls} value={form.email ?? ''} oninput={(e) => set('email', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Tel</label>
        <input class={inputCls} value={form.tel ?? ''} oninput={(e) => set('tel', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Avatar URL</label>
        <input class={inputCls} value={form.avatarUrl ?? ''} oninput={(e) => set('avatarUrl', (e.target as HTMLInputElement).value)} />
      </div>
      <div class="flex flex-col gap-1">
        <label class={labelCls}>Website URL</label>
        <input class={inputCls} value={form.personalWebsiteUrl ?? ''} oninput={(e) => set('personalWebsiteUrl', (e.target as HTMLInputElement).value)} />
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <label class={labelCls}>Description</label>
      <textarea rows={2} class={textareaCls} value={form.description ?? ''} oninput={(e) => set('description', (e.target as HTMLTextAreaElement).value)}></textarea>
    </div>
    <div class="flex flex-col gap-1">
      <label class={labelCls}>About</label>
      <textarea rows={2} class={textareaCls} value={form.about ?? ''} oninput={(e) => set('about', (e.target as HTMLTextAreaElement).value)}></textarea>
    </div>
    <div class="flex flex-col gap-1">
      <label class={labelCls}>Summary</label>
      <textarea rows={4} class={textareaCls} value={form.summary ?? ''} oninput={(e) => set('summary', (e.target as HTMLTextAreaElement).value)}></textarea>
    </div>
    <div class="flex flex-col gap-1">
      <label class={labelCls}>Social (JSON)</label>
      <textarea
        rows={5}
        class="{textareaCls} font-mono text-xs"
        value={form.social ?? '[]'}
        oninput={(e) => set('social', (e.target as HTMLTextAreaElement).value)}
        placeholder={'[{"name":"github","url":"https://github.com/..."}]'}
      ></textarea>
    </div>
  </form>
{/if}
