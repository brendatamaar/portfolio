<script lang="ts">
  import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Code2,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    List,
    ListOrdered,
    Minus,
    Link2,
    Image,
    StickyNote,
    BookOpenText,
    ScrollText,
    Bot,
    PanelLeft,
    Columns2,
    Eye,
    PanelRight,
  } from 'lucide-svelte'

  type ViewMode = 'editor' | 'split' | 'preview'

  interface Props {
    viewMode: ViewMode
    onViewMode: (m: ViewMode) => void
    onFormat: (prefix: string, suffix?: string, placeholder?: string) => void
    onLinePrefix: (prefix: string) => void
    onInsert: (text: string) => void
    onGallery: () => void
    onMetaToggle: () => void
    metaOpen: boolean
  }

  let {
    viewMode,
    onViewMode,
    onFormat,
    onLinePrefix,
    onInsert,
    onGallery,
    onMetaToggle,
    metaOpen,
  }: Props = $props()

  const ADMONITION_TYPES = [
    'note', 'tip', 'warning', 'danger', 'info',
    'tldr', 'update', 'definition', 'ai', 'details',
  ]
  let admonitionOpen = $state(false)

  const base = 'flex items-center justify-center w-7 h-7 rounded transition-colors'
  const active = 'bg-black/20 dark:bg-white/20 text-black dark:text-white'
  const inactive = 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
  const labelBase = 'flex items-center gap-1 px-2 h-7 font-mono text-[10px] uppercase tracking-widest rounded transition-colors'
</script>

<div
  class="relative flex h-10 items-center gap-0.5 overflow-x-auto border-b border-black/10 bg-[#f0f0f0] px-3 dark:border-white/10 dark:bg-[#111]"
>
  <!-- Bold -->
  <button type="button" title="Bold (Ctrl+B)" onclick={() => onFormat('**', '**', 'bold')} class="{base} {inactive}">
    <Bold size={13} />
  </button>
  <!-- Italic -->
  <button type="button" title="Italic (Ctrl+I)" onclick={() => onFormat('*', '*', 'italic')} class="{base} {inactive}">
    <Italic size={13} />
  </button>
  <!-- Underline -->
  <button type="button" title="Underline" onclick={() => onFormat('<u>', '</u>', 'text')} class="{base} {inactive}">
    <Underline size={13} />
  </button>
  <!-- Strikethrough -->
  <button type="button" title="Strikethrough" onclick={() => onFormat('~~', '~~', 'text')} class="{base} {inactive}">
    <Strikethrough size={13} />
  </button>
  <!-- Inline code -->
  <button type="button" title="Inline code" onclick={() => onFormat('`', '`', 'code')} class="{base} {inactive}">
    <Code size={13} />
  </button>
  <!-- Code block -->
  <button type="button" title="Code block" onclick={() => onInsert('\n```\n\n```\n')} class="{base} {inactive}">
    <Code2 size={13} />
  </button>

  <div class="mx-0.5 h-4 w-px shrink-0 bg-black/15 dark:bg-white/15"></div>

  <!-- H1 -->
  <button type="button" title="Heading 1" onclick={() => onLinePrefix('# ')} class="{base} {inactive}">
    <Heading1 size={13} />
  </button>
  <!-- H2 -->
  <button type="button" title="Heading 2" onclick={() => onLinePrefix('## ')} class="{base} {inactive}">
    <Heading2 size={13} />
  </button>
  <!-- H3 -->
  <button type="button" title="Heading 3" onclick={() => onLinePrefix('### ')} class="{base} {inactive}">
    <Heading3 size={13} />
  </button>

  <div class="mx-0.5 h-4 w-px shrink-0 bg-black/15 dark:bg-white/15"></div>

  <!-- Blockquote -->
  <button type="button" title="Blockquote" onclick={() => onLinePrefix('> ')} class="{base} {inactive}">
    <Quote size={13} />
  </button>
  <!-- Bullet list -->
  <button type="button" title="Bullet list" onclick={() => onLinePrefix('- ')} class="{base} {inactive}">
    <List size={13} />
  </button>
  <!-- Ordered list -->
  <button type="button" title="Numbered list" onclick={() => onLinePrefix('1. ')} class="{base} {inactive}">
    <ListOrdered size={13} />
  </button>
  <!-- HR -->
  <button type="button" title="Horizontal rule" onclick={() => onInsert('\n---\n')} class="{base} {inactive}">
    <Minus size={13} />
  </button>

  <div class="mx-0.5 h-4 w-px shrink-0 bg-black/15 dark:bg-white/15"></div>

  <!-- Link -->
  <button type="button" title="Link (Ctrl+K)" onclick={() => onFormat('[', '](url)', 'link text')} class="{base} {inactive}">
    <Link2 size={13} />
  </button>
  <!-- Image -->
  <button type="button" title="Insert image" onclick={onGallery} class="{base} {inactive}">
    <Image size={13} />
  </button>
  <!-- Footnote -->
  <button type="button" title="Footnote/sidenote" onclick={() => onInsert('^[note]')} class="{labelBase} {inactive}">
    <StickyNote size={13} />
    <span>Note</span>
  </button>
  <!-- Glossary ref -->
  <button type="button" title="Glossary reference [gloss:term]" onclick={() => onFormat('[gloss:', ']', 'term')} class="{labelBase} {inactive}">
    <BookOpenText size={13} />
    <span>Glossary</span>
  </button>
  <!-- Cite ref -->
  <button type="button" title="Bibliography reference [cite:key]" onclick={() => onFormat('[cite:', ']', 'key')} class="{labelBase} {inactive}">
    <ScrollText size={13} />
    <span>Bibliography</span>
  </button>

  <div class="mx-0.5 h-4 w-px shrink-0 bg-black/15 dark:bg-white/15"></div>

  <!-- Admonition dropdown -->
  <div class="relative">
    <button
      type="button"
      title="Admonition"
      onclick={() => (admonitionOpen = !admonitionOpen)}
      class="{labelBase} {admonitionOpen ? active : inactive}"
    >
      <Bot size={13} />
      <span>Admonition</span>
    </button>
    {#if admonitionOpen}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="absolute top-full left-0 z-50 mt-1 flex min-w-max flex-col border border-black/20 bg-[#f0f0f0] shadow-xl dark:border-white/20 dark:bg-[#1a1a1a]"
        onmousedown={(e) => e.stopPropagation()}
      >
        {#each ADMONITION_TYPES as t}
          <button
            type="button"
            onclick={() => { onInsert(`\n:::${t}\n\n:::\n`); admonitionOpen = false }}
            class="px-3 py-1.5 text-left font-mono text-[11px] text-black/60 transition-colors hover:bg-black/10 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
          >
            :::{t}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Spacer -->
  <div class="flex-1"></div>

  <!-- View mode -->
  <button type="button" title="Editor only" onclick={() => onViewMode('editor')} class="{base} {viewMode === 'editor' ? active : inactive}">
    <PanelLeft size={13} />
  </button>
  <button type="button" title="Split view" onclick={() => onViewMode('split')} class="{base} {viewMode === 'split' ? active : inactive}">
    <Columns2 size={13} />
  </button>
  <button type="button" title="Preview only" onclick={() => onViewMode('preview')} class="{base} {viewMode === 'preview' ? active : inactive}">
    <Eye size={13} />
  </button>

  <div class="mx-0.5 h-4 w-px shrink-0 bg-black/15 dark:bg-white/15"></div>

  <!-- Meta sidebar toggle -->
  <button type="button" title="Post settings" onclick={onMetaToggle} class="{base} {metaOpen ? active : inactive}">
    <PanelRight size={13} />
  </button>
</div>
