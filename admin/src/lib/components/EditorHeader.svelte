<script lang="ts">
  import { ArrowLeft, Save, Globe, Eye, EyeOff } from 'lucide-svelte'

  interface Props {
    langTab: 'en' | 'id'
    title: string
    titleId: string
    status: 'draft' | 'published'
    saving: boolean
    saveMsg: string
    savedAgoText: string
    onLangChange: (l: 'en' | 'id') => void
    onTitleInput: (val: string) => void
    onPostPreview: () => void
    onSave: () => void
    onPublish: () => void
    onUnpublish: () => void
    isDirty?: boolean
    canSave?: boolean
  }

  let {
    langTab,
    title,
    titleId,
    status,
    saving,
    saveMsg,
    savedAgoText,
    onLangChange,
    onTitleInput,
    onPostPreview,
    onSave,
    onPublish,
    onUnpublish,
    isDirty = false,
    canSave = true,
  }: Props = $props()

  // Mirror old PostEditorHeader.tsx's `activeTitle` derived value
  let activeTitle = $derived(langTab === 'id' ? titleId : title)
</script>

<header class="flex h-14 shrink-0 items-center gap-3 border-b border-ring px-4 dark:border-white/10">
  <a
    href="/"
    aria-label="Back to posts list"
    class="shrink-0 text-quiet transition-colors hover:text-ink/40 dark:hover:text-ink"
  >
    <ArrowLeft size={15} />
  </a>

  <!-- Language tabs -->
  <div class="flex shrink-0 gap-0.5 border border-ring">
    {#each ['en', 'id'] as const as l}
      <button
        type="button"
        onclick={() => onLangChange(l)}
        class={[
          'px-2.5 py-1 text-[11px] transition-colors',
          langTab === l
            ? 'bg-ink text-page'
            : 'text-quiet hover:text-ink/40 dark:hover:text-ink',
        ].join(' ')}
      >
        {l}
      </button>
    {/each}
  </div>

  <!-- Title input + status badge -->
  <div class="flex min-w-0 flex-1 items-center gap-2.5">
    <input
      value={activeTitle}
      oninput={(e) => onTitleInput((e.target as HTMLInputElement).value)}
      placeholder={langTab === 'id' ? 'Judul tulisan... (ID)' : 'Post title...'}
      class="min-w-0 flex-1 bg-transparent text-base font-medium tracking-tight text-ink placeholder:text-quiet/50 outline-none"
    />
    <span
      class={[
        'shrink-0 border px-1.5 py-0.5 text-[11px]',
        status === 'published'
          ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
          : 'border-ring text-quiet dark:border-white/15 dark:text-quiet',
      ].join(' ')}
    >
      {status}
    </span>
  </div>

  <!-- Save state + action buttons -->
  <div class="flex shrink-0 items-center gap-2">
    {#if isDirty}
      <span class="flex items-center gap-1.5 text-[12px] text-amber-600 dark:text-amber-400" title="Changes not saved to the server yet"><span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>Unsaved</span>
    {/if}
    {#if saveMsg}
      <span class="text-[12px] text-red-500">{saveMsg}</span>
    {:else if savedAgoText}
      <span class="text-[12px] text-quiet dark:text-quiet">
        {savedAgoText}
      </span>
    {/if}

    <button
      type="button"
      onclick={onPostPreview}
      class="flex items-center gap-1.5 rounded-full border border-ring px-3.5 py-1.5 text-[13px] font-medium text-body transition-colors hover:border-quiet hover:text-ink disabled:opacity-50"
    >
      <Eye size={12} />
      Preview
    </button>

    {#if status === 'published'}
      <button
        type="button"
        onclick={onUnpublish}
        disabled={saving}
        class="flex items-center gap-1.5 rounded-full border border-ring px-3.5 py-1.5 text-[13px] font-medium text-body transition-colors hover:border-quiet hover:text-ink disabled:opacity-50"
      >
        <EyeOff size={12} />
        Unpublish
      </button>
    {:else}
      <button
        type="button"
        onclick={onPublish}
        disabled={saving || !canSave}
        title={canSave ? 'Publish this post' : 'Add a title first'}
        class="flex items-center gap-1.5 rounded-full bg-pen px-3.5 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50 dark:text-[#131313]"
      >
        <Globe size={12} />
        Publish
      </button>
    {/if}

    <button
      type="button"
      onclick={onSave}
      disabled={saving || !canSave}
      title={canSave ? 'Save (Ctrl+S)' : 'Add a title first'}
      class="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-page transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      <Save size={12} />
      Save
    </button>
  </div>
</header>
