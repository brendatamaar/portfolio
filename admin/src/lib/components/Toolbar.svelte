<script lang="ts">
  type ViewMode = 'editor' | 'split' | 'preview'

  interface Props {
    viewMode: ViewMode
    onViewMode: (m: ViewMode) => void
    onFormat: (prefix: string, suffix?: string, placeholder?: string) => void
    onLinePrefix: (prefix: string) => void
    onInsert: (text: string) => void
    onGallery: () => void
    onDownload: () => void
  }

  let { viewMode, onViewMode, onFormat, onLinePrefix, onInsert, onGallery, onDownload }: Props =
    $props()

  type Btn = { label: string; title: string; action: () => void; mono?: boolean }

  const groups: Btn[][] = [
    [
      { label: 'H2', title: 'Heading 2', mono: true, action: () => onLinePrefix('## ') },
      { label: 'H3', title: 'Heading 3', mono: true, action: () => onLinePrefix('### ') },
    ],
    [
      { label: 'B', title: 'Bold (Ctrl+B)', action: () => onFormat('**', '**', 'bold') },
      { label: 'I', title: 'Italic (Ctrl+I)', action: () => onFormat('*', '*', 'italic') },
      { label: 'S', title: 'Strikethrough', action: () => onFormat('~~', '~~', 'text') },
      { label: '`', title: 'Inline code', mono: true, action: () => onFormat('`', '`', 'code') },
    ],
    [
      { label: '•', title: 'Bullet list', action: () => onLinePrefix('- ') },
      { label: '1.', title: 'Numbered list', mono: true, action: () => onLinePrefix('1. ') },
      { label: '"', title: 'Blockquote', action: () => onLinePrefix('> ') },
    ],
    [
      {
        label: 'Link',
        title: 'Link (Ctrl+K)',
        action: () => onFormat('[', '](url)', 'link text'),
      },
      { label: 'Fn', title: 'Footnote', action: () => onInsert('^[footnote]') },
      {
        label: '```',
        title: 'Code block',
        mono: true,
        action: () => onInsert('\n```\n\n```\n'),
      },
      { label: 'IMG', title: 'Insert image from gallery', action: onGallery },
    ],
    [
      {
        label: 'Note',
        title: 'Note admonition',
        action: () => onInsert('\n:::note Note\n\n:::\n'),
      },
      { label: 'Tip', title: 'Tip admonition', action: () => onInsert('\n:::tip Tip\n\n:::\n') },
      {
        label: 'Warn',
        title: 'Warning admonition',
        action: () => onInsert('\n:::warning Warning\n\n:::\n'),
      },
      {
        label: 'Danger',
        title: 'Danger admonition',
        action: () => onInsert('\n:::danger Danger\n\n:::\n'),
      },
      {
        label: 'Details',
        title: 'Details / spoiler block',
        action: () => onInsert('\n:::details Summary\n\n:::\n'),
      },
    ],
  ]
</script>

<div
  class="flex items-center justify-between border-b-2 border-black bg-[#f0f0f0] px-2 py-1 dark:border-white dark:bg-[#1a1a1a]"
>
  <!-- Formatting buttons -->
  <div class="flex items-center gap-0 overflow-x-auto">
    {#each groups as group, gi}
      {#if gi > 0}
        <div class="mx-1.5 h-4 w-px shrink-0 bg-black/20 dark:bg-white/20"></div>
      {/if}
      {#each group as btn}
        <button
          type="button"
          title={btn.title}
          onclick={btn.action}
          class="shrink-0 rounded-none px-2 py-1 text-[11px] font-bold uppercase tracking-wide hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black {btn.mono ? 'font-mono' : ''}"
        >
          {btn.label}
        </button>
      {/each}
    {/each}
  </div>

  <!-- Right: download + view mode -->
  <div class="flex shrink-0 items-center gap-2 pl-3">
    <button
      type="button"
      title="Download as Markdown"
      onclick={onDownload}
      class="px-2 py-1 text-[11px] font-bold uppercase tracking-wide hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black"
    >
      ↓ MD
    </button>
    <div class="flex border-2 border-black dark:border-white">
      {#each (['editor', 'split', 'preview'] as const) as mode}
        <button
          type="button"
          onclick={() => onViewMode(mode)}
          class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors {viewMode === mode
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'dark:text-white dark:hover:bg-white/10 hover:bg-black/10'}"
        >
          {mode === 'editor' ? 'Edit' : mode === 'split' ? 'Split' : 'Preview'}
        </button>
      {/each}
    </div>
  </div>
</div>
