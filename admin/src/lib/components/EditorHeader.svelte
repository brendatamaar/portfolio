<script lang="ts">
  import { ArrowLeft, Save, Globe, EyeOff, Sun, Moon } from 'lucide-svelte'

  interface Props {
    langTab: 'en' | 'id'
    title: string
    titleId: string
    status: 'draft' | 'published'
    saving: boolean
    saveMsg: string
    savedAgoText: string
    previewUrl: string | null
    dark: boolean
    onLangChange: (l: 'en' | 'id') => void
    onTitleInput: (val: string) => void
    onSave: () => void
    onPublish: () => void
    onUnpublish: () => void
    onToggleTheme: () => void
  }

  let {
    langTab, title, titleId, status, saving,
    saveMsg, savedAgoText, previewUrl, dark,
    onLangChange, onTitleInput, onSave, onPublish, onUnpublish, onToggleTheme,
  }: Props = $props()
</script>

<header class="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 px-4 dark:border-white/10">
  <a
    href="/"
    class="shrink-0 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
    aria-label="Back to posts"
  >
    <ArrowLeft size={15} />
  </a>

  <div class="flex shrink-0 gap-0.5 border border-black/10 dark:border-white/10">
    {#each (['en', 'id'] as const) as l}
      <button
        onclick={() => onLangChange(l)}
        class={[
          'px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-colors',
          langTab === l
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white',
        ].join(' ')}
      >
        {l}
      </button>
    {/each}
  </div>

  <div class="flex min-w-0 flex-1 items-center gap-2.5">
    <input
      value={langTab === 'id' ? titleId : title}
      oninput={(e) => onTitleInput((e.target as HTMLInputElement).value)}
      placeholder={langTab === 'id' ? 'Judul tulisan... (ID)' : 'Post title...'}
      class="min-w-0 flex-1 border-none bg-transparent text-base font-black tracking-tight text-black uppercase placeholder-black/20 outline-none dark:text-white dark:placeholder-white/20"
    />
    <span
      class={[
        'shrink-0 border px-1.5 py-0.5 font-mono text-[9px] tracking-widest uppercase',
        status === 'published'
          ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
          : 'border-black/15 text-black/30 dark:border-white/15 dark:text-white/30',
      ].join(' ')}
    >
      {status}
    </span>
  </div>

  <div class="flex shrink-0 items-center gap-2">
    {#if saveMsg}
      <span class="font-mono text-[10px] tracking-widest text-red-500 uppercase">{saveMsg}</span>
    {:else if savedAgoText}
      <span class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">{savedAgoText}</span>
    {/if}

    {#if previewUrl}
      <a
        href={previewUrl}
        target="_blank"
        class="flex items-center gap-1.5 border border-black/20 px-3 py-1.5 text-xs font-bold tracking-wide text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
      >
        Preview ↗
      </a>
    {/if}

    {#if status === 'published'}
      <button
        onclick={onUnpublish}
        disabled={saving}
        class="flex items-center gap-1.5 border border-black/20 px-3 py-1.5 text-xs font-bold tracking-wide text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black disabled:opacity-50 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
      >
        <EyeOff size={12} />
        Unpublish
      </button>
    {:else}
      <button
        onclick={onPublish}
        disabled={saving}
        class="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
      >
        <Globe size={12} />
        Publish
      </button>
    {/if}

    <button
      onclick={onSave}
      disabled={saving}
      class="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
    >
      <Save size={12} />
      {saving ? 'Saving…' : 'Save'}
    </button>

    <button
      onclick={onToggleTheme}
      class="p-1.5 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
      title="Toggle theme"
    >
      {#if dark}
        <Sun size={15} />
      {:else}
        <Moon size={15} />
      {/if}
    </button>
  </div>
</header>
