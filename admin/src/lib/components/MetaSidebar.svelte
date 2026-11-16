<script lang="ts">
  import { Image as ImageIcon, RefreshCw, X } from 'lucide-svelte'
  import type { PostTag } from '$lib/types'

  interface Heading {
    level: number
    text: string
    index: number
  }

  interface Props {
    lang: 'en' | 'id'
    slug: string
    publishedAt: string
    description: string
    descriptionId: string
    coverImageUrl: string
    allTags: PostTag[]
    selectedTagIds: number[]
    newTagName: string
    headings: Heading[]
    wordCount: number
    charCount: number
    onSlugInput: (val: string) => void
    onSlugTouch: () => void
    onPublishedAtChange: (val: string) => void
    onDescriptionInput: (val: string) => void
    onCoverSelect: () => void
    onCoverRemove: () => void
    onToggleTag: (id: number) => void
    onNewTagNameChange: (val: string) => void
    onAddTag: () => void
    onJumpToHeading: (charIndex: number) => void
  }

  let {
    lang, slug, publishedAt, description, descriptionId,
    coverImageUrl, allTags, selectedTagIds, newTagName,
    headings, wordCount, charCount,
    onSlugInput, onSlugTouch, onPublishedAtChange, onDescriptionInput,
    onCoverSelect, onCoverRemove, onToggleTag, onNewTagNameChange,
    onAddTag, onJumpToHeading,
  }: Props = $props()

  const inputClass = 'w-full border-b border-ring bg-transparent pb-1 font-mono text-xs text-body outline-none focus:border-quiet dark:border-white/15 dark:text-white/70 dark:focus:border-quiet'
  const labelClass = 'text-[12px] text-quiet dark:text-quiet'
</script>

<div class="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-ring bg-raised dark:border-white/10 dark:bg-raised">
  <div class="flex flex-col gap-5 p-4">

    <div class="flex flex-col gap-1.5">
      <label for="meta-slug" class={labelClass}>Slug</label>
      <input
        id="meta-slug"
        value={slug}
        oninput={(e) => { onSlugTouch(); onSlugInput((e.target as HTMLInputElement).value) }}
        class={inputClass}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="meta-date" class={labelClass}>Published at</label>
      <input
        id="meta-date"
        type="date"
        value={publishedAt}
        onchange={(e) => onPublishedAtChange((e.target as HTMLInputElement).value)}
        class={inputClass}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <label for="meta-desc" class={labelClass}>
        Description {lang === 'id' ? '(ID)' : '(EN)'}
      </label>
      <textarea
        id="meta-desc"
        value={lang === 'id' ? descriptionId : description}
        oninput={(e) => onDescriptionInput((e.target as HTMLTextAreaElement).value)}
        placeholder={lang === 'id' ? 'Deskripsi singkat... (ID)' : 'Short description...'}
        rows={3}
        class="w-full resize-none border border-ring bg-transparent p-2 font-mono text-xs text-body placeholder-black/20 outline-none focus:border-leader dark:border-white/10 dark:text-white/70 dark:placeholder-white/20 dark:focus:border-quiet"
      ></textarea>
    </div>

    <div class="flex flex-col gap-1.5">
      <span class={labelClass}>Cover image</span>
      {#if coverImageUrl}
        <div class="group relative aspect-video w-full overflow-hidden border border-ring">
          <img src={coverImageUrl} alt="Cover" class="h-full w-full object-cover" loading="lazy" />
          <div class="absolute inset-0 flex items-center justify-center gap-2 bg-ink/0 opacity-0 transition-all group-hover:bg-raised0 group-hover:opacity-100">
            <button type="button" onclick={onCoverSelect} title="Change cover" class="bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20">
              <RefreshCw size={14} />
            </button>
            <button type="button" onclick={onCoverRemove} title="Remove cover" class="bg-white/10 p-1.5 text-white transition-colors hover:bg-red-500/60">
              <X size={14} />
            </button>
          </div>
        </div>
      {:else}
        <button
          type="button"
          onclick={onCoverSelect}
          class="flex aspect-video w-full flex-col items-center justify-center gap-1.5 border border-dashed border-leader text-quiet transition-colors hover:border-quiet hover:text-quiet dark:border-white/20 dark:text-quiet dark:hover:border-white/40 dark:hover:text-ink/50"
        >
          <ImageIcon size={18} />
          <span class="text-[12px]">Select cover</span>
        </button>
      {/if}
    </div>

    <div class="flex flex-col gap-2">
      <span class={labelClass}>Tags</span>
      <div class="flex flex-wrap gap-1.5">
        {#each allTags as tag (tag.id)}
          <button
            type="button"
            onclick={() => onToggleTag(tag.id)}
            class={[
              'border px-2 py-0.5 font-mono text-[11px] transition-colors',
              selectedTagIds.includes(tag.id)
                ? 'border-leader bg-raised text-ink dark:border-white dark:bg-white/10 dark:text-white'
                : 'border-leader text-quiet hover:border-quiet dark:border-white/20 dark:text-quiet dark:hover:border-white/40',
            ].join(' ')}
          >
            #{tag.name}
          </button>
        {/each}
      </div>
      <input
        value={newTagName}
        oninput={(e) => onNewTagNameChange((e.target as HTMLInputElement).value)}
        onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
        placeholder="+ new tag"
        class="w-full border-b border-ring bg-transparent pb-0.5 font-mono text-[11px] text-quiet placeholder-black/20 outline-none focus:border-leader dark:border-white/10 dark:text-quiet dark:placeholder-white/20 dark:focus:border-quiet"
      />
    </div>

    {#if headings.length > 0}
      <div class="flex flex-col gap-1.5">
        <span class={labelClass}>Outline</span>
        <div class="flex flex-col gap-0.5">
          {#each headings as h, i (i)}
            <button
              type="button"
              onclick={() => onJumpToHeading(h.index)}
              style="padding-left: {(h.level - 1) * 8}px"
              class="truncate text-left font-mono text-[11px] text-quiet transition-colors hover:text-ink/50 dark:hover:text-ink"
            >
              {h.text}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="mt-auto flex gap-3 border-t border-ring px-4 py-2.5 dark:border-white/10">
    <span class="text-[12px] text-quiet dark:text-quiet">{wordCount} words</span>
    <span class="text-[12px] text-quiet dark:text-white/20">{charCount} chars</span>
  </div>
</div>
