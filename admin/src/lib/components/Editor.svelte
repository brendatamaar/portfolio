<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { ArrowLeft, Save, Globe, EyeOff, Sun, Moon, Image as ImageIcon, X, RefreshCw } from 'lucide-svelte'
  import { api } from '$lib/api'
  import type {
    AdminPost,
    PostTag,
    GlossaryEntry,
    BibliographyEntry,
    BibSourceType,
    PostPayload,
  } from '$lib/types'
  import ImageGallery from './ImageGallery.svelte'
  import Toast from './Toast.svelte'
  import Toolbar from './Toolbar.svelte'
  import { parse } from '@portfolio/shared/markdown/parser'

  interface Props {
    post: AdminPost | null
    allTags: PostTag[]
  }
  let { post, allTags: initialTags }: Props = $props()

  type ViewMode = 'editor' | 'split' | 'preview'

  // --- Theme ---
  let dark = $state(false)
  onMount(() => {
    dark = localStorage.getItem('admin-theme') === 'dark'
  })
  function toggleTheme() {
    dark = !dark
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('admin-theme', dark ? 'dark' : 'light')
  }

  // --- Form state ---
  let langTab = $state<'en' | 'id'>('en')
  let activeTab = $state<'content' | 'glossary' | 'bibliography'>('content')
  let viewMode = $state<ViewMode>('editor')

  let title = $state(untrack(() => post?.title ?? ''))
  let slug = $state(untrack(() => post?.slug ?? ''))
  let description = $state(untrack(() => post?.description ?? ''))
  let content = $state(untrack(() => post?.content ?? ''))
  let titleId = $state(untrack(() => post?.titleId ?? ''))
  let descriptionId = $state(untrack(() => post?.descriptionId ?? ''))
  let contentId = $state(untrack(() => post?.contentId ?? ''))
  let status = $state<'draft' | 'published'>(untrack(() => post?.status ?? 'draft'))
  let coverImageUrl = $state(untrack(() => post?.coverImageUrl ?? ''))
  let publishedAt = $state(untrack(() =>
    post?.publishedAt
      ? new Date(post.publishedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  ))

  let selectedTagIds = $state<number[]>(untrack(() => post?.tags.map((t) => t.id) ?? []))
  let allTags = $state<PostTag[]>(untrack(() => initialTags))
  let newTagName = $state('')

  let glossaryEn = $state<GlossaryEntry[]>(untrack(() => post?.glossaryEn ?? []))
  let glossaryId = $state<GlossaryEntry[]>(untrack(() => post?.glossaryId ?? []))
  let bibliographyEn = $state<BibliographyEntry[]>(untrack(() => post?.bibliographyEn ?? []))
  let bibliographyId = $state<BibliographyEntry[]>(untrack(() => post?.bibliographyId ?? []))

  let saving = $state(false)
  let savedAt = $state<Date | null>(null)
  let saveMsg = $state('')
  let postId = $state<number | null>(untrack(() => post?.id ?? null))

  let showMeta = $state(false)
  let showGallery = $state(false)
  let showCoverGallery = $state(false)
  let galleryTarget = $state<'content' | 'cover'>('content')

  let textareaRef = $state<HTMLTextAreaElement | null>(null)
  let toastRef =
    $state<{ show: (msg: string, type?: 'success' | 'error' | 'info', dur?: number) => void } | null>(
      null,
    )

  // Auto-generate slug from title (only for new posts)
  let slugTouched = false
  $effect(() => {
    if (!postId && !slugTouched && title) {
      slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
    }
  })

  // --- Autosave ---
  let autosaveTimer = 0
  $effect(() => {
    const _ = [
      title, description, content,
      titleId, descriptionId, contentId,
      status, coverImageUrl, publishedAt,
      selectedTagIds.join(),
      JSON.stringify(glossaryEn), JSON.stringify(glossaryId),
      JSON.stringify(bibliographyEn), JSON.stringify(bibliographyId),
    ]
    clearTimeout(autosaveTimer)
    autosaveTimer = window.setTimeout(() => save(true), 5000)
    return () => clearTimeout(autosaveTimer)
  })

  async function save(silent = false, toStatus?: 'draft' | 'published') {
    if (!title.trim()) {
      if (!silent) toastRef?.show('Title is required', 'error')
      return
    }
    saving = true
    saveMsg = ''
    const resolvedStatus = toStatus ?? status
    const payload: PostPayload = {
      title,
      slug,
      description,
      content,
      titleId: titleId ?? '',
      descriptionId: descriptionId ?? '',
      contentId: contentId ?? '',
      status: resolvedStatus,
      coverImageUrl: coverImageUrl || null,
      tagIds: selectedTagIds,
      publishedAt:
        resolvedStatus === 'published' && publishedAt
          ? new Date(publishedAt).toISOString()
          : null,
      glossaryEn,
      glossaryId,
      bibliographyEn,
      bibliographyId,
    }
    try {
      if (postId) {
        await api.updatePost(postId, payload)
      } else {
        const created = await api.createPost(payload)
        postId = created.id
        history.replaceState({}, '', `/posts/${created.id}`)
      }
      if (toStatus) status = toStatus
      savedAt = new Date()
      if (!silent) toastRef?.show('Saved!', 'success')
    } catch (e) {
      saveMsg = 'Save failed'
      toastRef?.show(`Save failed: ${e}`, 'error')
    } finally {
      saving = false
    }
  }

  async function addTag() {
    const name = newTagName.trim()
    if (!name) return
    try {
      const tag = await api.createTag(name)
      allTags = [...allTags, tag]
      selectedTagIds = [...selectedTagIds, tag.id]
      newTagName = ''
    } catch (e) {
      toastRef?.show(`Tag failed: ${e}`, 'error')
    }
  }

  function toggleTag(id: number) {
    selectedTagIds = selectedTagIds.includes(id)
      ? selectedTagIds.filter((t) => t !== id)
      : [...selectedTagIds, id]
  }

  // --- Content helpers ---
  function getContent() {
    return langTab === 'en' ? content : contentId
  }
  function setContent(val: string) {
    if (langTab === 'en') content = val
    else contentId = val
  }

  // --- Formatting ---
  function insertAtCursor(text: string) {
    const el = textareaRef
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = el.value.slice(0, start) + text + el.value.slice(end)
    setContent(newVal)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length
      el.focus()
    })
  }

  function wrapSelection(prefix: string, suffix = prefix, placeholder = 'text') {
    const el = textareaRef
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = el.value.slice(start, end) || placeholder
    const replacement = prefix + selected + suffix
    const newVal = el.value.slice(0, start) + replacement + el.value.slice(end)
    setContent(newVal)
    requestAnimationFrame(() => {
      if (!el) return
      if (end === start) {
        el.selectionStart = start + prefix.length
        el.selectionEnd = start + prefix.length + selected.length
      } else {
        el.selectionStart = start
        el.selectionEnd = start + replacement.length
      }
      el.focus()
    })
  }

  function insertLinePrefix(prefix: string) {
    const el = textareaRef
    if (!el) return
    const text = el.value
    const start = el.selectionStart
    const lineStart = text.lastIndexOf('\n', start - 1) + 1
    const newVal = text.slice(0, lineStart) + prefix + text.slice(lineStart)
    setContent(newVal)
    requestAnimationFrame(() => {
      if (!el) return
      el.selectionStart = el.selectionEnd = start + prefix.length
      el.focus()
    })
  }

  // --- Image insertion ---
  function handleGallerySelect(url: string) {
    showGallery = false
    insertAtCursor(`\n![](${url})\n`)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer?.files[0]
    if (file?.type.startsWith('image/')) uploadAndInsert(file)
  }

  function handlePaste(e: ClipboardEvent) {
    const file = Array.from(e.clipboardData?.items ?? [])
      .find((i) => i.type.startsWith('image/'))
      ?.getAsFile()
    if (file) {
      e.preventDefault()
      uploadAndInsert(file)
    }
  }

  async function uploadAndInsert(file: File) {
    toastRef?.show('Uploading…', 'info')
    try {
      const img = await api.uploadImage(file)
      insertAtCursor(`\n![](${img.url})\n`)
      toastRef?.show('Image inserted', 'success')
    } catch (e) {
      toastRef?.show(`Upload failed: ${e}`, 'error')
    }
  }

  // --- Keyboard shortcuts ---
  function handleKeydown(e: KeyboardEvent) {
    const ctrl = e.ctrlKey || e.metaKey
    if (!ctrl) return
    switch (e.key) {
      case 's':
        e.preventDefault()
        save()
        break
      case 'b':
        e.preventDefault()
        wrapSelection('**', '**', 'bold')
        break
      case 'i':
        e.preventDefault()
        wrapSelection('*', '*', 'italic')
        break
      case 'k':
        e.preventDefault()
        wrapSelection('[', '](url)', 'link text')
        break
    }
  }

  // --- Live preview ---
  let previewHtml = $derived.by(() => {
    try {
      return parse(getContent(), { glossMap: new Map(), citeMap: new Map() }).html
    } catch {
      return ''
    }
  })

  // --- Saved ago ---
  let savedAgoText = $derived(
    savedAt ? `Saved ${Math.round((Date.now() - savedAt.getTime()) / 1000)}s ago` : '',
  )

  // --- Word count ---
  let wordCount = $derived(
    getContent().trim() ? getContent().trim().split(/\s+/).length : 0,
  )

  // --- Heading outline ---
  let headings = $derived(
    [...getContent().matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => ({
      level: m[1].length,
      text: m[2].trim(),
      index: m.index ?? 0,
    })),
  )

  function jumpToHeading(charIndex: number) {
    const ta = textareaRef
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(charIndex, charIndex)
    const linesBefore = getContent().slice(0, charIndex).split('\n').length - 1
    const lineHeight = ta.scrollHeight / Math.max(getContent().split('\n').length, 1)
    ta.scrollTop = linesBefore * lineHeight - ta.clientHeight / 3
  }

  // --- Glossary helpers ---
  const BIB_TYPES: BibSourceType[] = ['web', 'docs', 'journal', 'article', 'book', 'video', 'podcast', 'repo', 'other']

  function addGlossEntry(lang: 'en' | 'id') {
    const blank: GlossaryEntry = { key: '', term: '', definition: '' }
    if (lang === 'en') glossaryEn = [...glossaryEn, blank]
    else glossaryId = [...glossaryId, blank]
  }
  function removeGlossEntry(lang: 'en' | 'id', idx: number) {
    if (lang === 'en') glossaryEn = glossaryEn.filter((_, i) => i !== idx)
    else glossaryId = glossaryId.filter((_, i) => i !== idx)
  }
  function updateGlossEntry(lang: 'en' | 'id', idx: number, field: keyof GlossaryEntry, val: string) {
    if (lang === 'en') glossaryEn = glossaryEn.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    else glossaryId = glossaryId.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
  }

  function addBibEntry(lang: 'en' | 'id') {
    const blank: BibliographyEntry = { key: '', text: '', sourceType: 'web' }
    if (lang === 'en') bibliographyEn = [...bibliographyEn, blank]
    else bibliographyId = [...bibliographyId, blank]
  }
  function removeBibEntry(lang: 'en' | 'id', idx: number) {
    if (lang === 'en') bibliographyEn = bibliographyEn.filter((_, i) => i !== idx)
    else bibliographyId = bibliographyId.filter((_, i) => i !== idx)
  }
  function updateBibEntry(lang: 'en' | 'id', idx: number, field: keyof BibliographyEntry, val: string) {
    if (lang === 'en') bibliographyEn = bibliographyEn.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    else bibliographyId = bibliographyId.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
  }

  // --- Raw (markdown) mode for glossary / bibliography ---
  // Format: entries separated by blank lines
  // Glossary:  "key :: Term\ndefinition…"
  // Bib:       "key [sourceType]\ncitation text…"

  let rawGlossMode = $state(false)
  let rawBibMode = $state(false)
  let rawGlossText = $state('')
  let rawBibText = $state('')

  function glossToRaw(entries: GlossaryEntry[]): string {
    return entries.map(e => `${e.key} :: ${e.term}\n${e.definition}`).join('\n\n')
  }
  function rawToGloss(raw: string): GlossaryEntry[] {
    return raw.split(/\n{2,}/).flatMap(block => {
      const trimmed = block.trim()
      if (!trimmed) return []
      const lines = trimmed.split('\n')
      const first = lines[0] ?? ''
      const sep = first.indexOf(' :: ')
      const key = sep >= 0 ? first.slice(0, sep).trim() : first.trim()
      const term = sep >= 0 ? first.slice(sep + 4).trim() : ''
      const definition = lines.slice(1).join('\n').trim()
      return [{ key, term, definition }]
    })
  }

  function bibToRaw(entries: BibliographyEntry[]): string {
    return entries.map(e => `${e.key} [${e.sourceType}]\n${e.text}`).join('\n\n')
  }
  function rawToBib(raw: string): BibliographyEntry[] {
    return raw.split(/\n{2,}/).flatMap(block => {
      const trimmed = block.trim()
      if (!trimmed) return []
      const lines = trimmed.split('\n')
      const first = lines[0] ?? ''
      const m = first.match(/^(.+?)\s+\[(\w+)\]$/)
      const key = m ? m[1].trim() : first.trim()
      const sourceType = (m ? m[2] : 'web') as BibSourceType
      const text = lines.slice(1).join('\n').trim()
      return [{ key, text, sourceType }]
    })
  }

  function toggleGlossRaw() {
    if (!rawGlossMode) {
      const entries = langTab === 'en' ? glossaryEn : glossaryId
      rawGlossText = glossToRaw(entries)
    } else {
      const parsed = rawToGloss(rawGlossText)
      if (langTab === 'en') glossaryEn = parsed
      else glossaryId = parsed
    }
    rawGlossMode = !rawGlossMode
  }

  function toggleBibRaw() {
    if (!rawBibMode) {
      const entries = langTab === 'en' ? bibliographyEn : bibliographyId
      rawBibText = bibToRaw(entries)
    } else {
      const parsed = rawToBib(rawBibText)
      if (langTab === 'en') bibliographyEn = parsed
      else bibliographyId = parsed
    }
    rawBibMode = !rawBibMode
  }

  // Reset raw mode when switching lang tabs
  $effect(() => {
    const _lang = langTab
    rawGlossMode = false
    rawBibMode = false
  })

  const previewUrl = $derived(
    postId ? `${import.meta.env.VITE_SITE_URL ?? 'http://localhost:4321'}/blog/${slug}` : null,
  )

  const glossaryCount = $derived((langTab === 'id' ? glossaryId : glossaryEn).length)
  const bibliographyCount = $derived((langTab === 'id' ? bibliographyId : bibliographyEn).length)
</script>

<svelte:window onkeydown={handleKeydown} />
<Toast bind:this={toastRef} />
<ImageGallery open={showGallery} onselect={handleGallerySelect} onclose={() => (showGallery = false)} />
<ImageGallery open={showCoverGallery} onselect={(url) => { coverImageUrl = url; showCoverGallery = false }} onclose={() => (showCoverGallery = false)} />

<div class="flex h-screen flex-col overflow-hidden bg-white text-black dark:bg-[#0a0a0a] dark:text-white">

  <!-- Header -->
  <header class="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 px-4 dark:border-white/10">
    <a
      href="/"
      class="shrink-0 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
      aria-label="Back to posts"
    >
      <ArrowLeft size={15} />
    </a>

    <!-- Language tabs -->
    <div class="flex shrink-0 gap-0.5 border border-black/10 dark:border-white/10">
      {#each (['en', 'id'] as const) as l}
        <button
          onclick={() => (langTab = l)}
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

    <!-- Title input -->
    <div class="flex min-w-0 flex-1 items-center gap-2.5">
      <input
        value={langTab === 'id' ? titleId : title}
        oninput={(e) =>
          langTab === 'id'
            ? (titleId = (e.target as HTMLInputElement).value)
            : (title = (e.target as HTMLInputElement).value)}
        placeholder={langTab === 'id' ? 'Judul tulisan... (ID)' : 'Post title...'}
        class="min-w-0 flex-1 border-none bg-transparent text-base font-black tracking-tight text-black uppercase placeholder-black/20 outline-none dark:text-white dark:placeholder-white/20"
      />
      <!-- Status badge -->
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

    <!-- Right actions -->
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
          onclick={() => save(false, 'draft')}
          disabled={saving}
          class="flex items-center gap-1.5 border border-black/20 px-3 py-1.5 text-xs font-bold tracking-wide text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black disabled:opacity-50 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
        >
          <EyeOff size={12} />
          Unpublish
        </button>
      {:else}
        <button
          onclick={() => save(false, 'published')}
          disabled={saving}
          class="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          <Globe size={12} />
          Publish
        </button>
      {/if}

      <button
        onclick={() => save()}
        disabled={saving}
        class="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
      >
        <Save size={12} />
        {saving ? 'Saving…' : 'Save'}
      </button>

      <button
        onclick={toggleTheme}
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

  <!-- Content tabs -->
  <div class="flex border-b border-black/10 dark:border-white/10">
    {#each (['content', 'glossary', 'bibliography'] as const) as tab}
      <button
        onclick={() => (activeTab = tab)}
        class={[
          'px-4 py-2 font-mono text-[11px] tracking-widest uppercase transition-colors',
          activeTab === tab
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white',
        ].join(' ')}
      >
        {tab === 'content' ? 'Content' : tab === 'glossary' ? `Glossary (${glossaryCount})` : `Bibliography (${bibliographyCount})`}
      </button>
    {/each}
  </div>

  <!-- Toolbar (content tab only) -->
  {#if activeTab === 'content'}
    <Toolbar
      {viewMode}
      onViewMode={(m) => (viewMode = m)}
      onFormat={wrapSelection}
      onLinePrefix={insertLinePrefix}
      onInsert={insertAtCursor}
      onGallery={() => { galleryTarget = 'content'; showGallery = true }}
      onMetaToggle={() => (showMeta = !showMeta)}
      metaOpen={showMeta}
    />
  {/if}

  <!-- Main area -->
  <div class="flex min-h-0 flex-1">
    <!-- Content pane -->
    <div class="flex min-h-0 flex-1 flex-col">

      {#if activeTab === 'content'}
        <div class="flex min-h-0 flex-1 divide-x divide-black/10 dark:divide-white/10">
          {#if viewMode !== 'preview'}
            <div class={viewMode === 'split' ? 'flex min-h-0 w-1/2 flex-col' : 'flex min-h-0 w-full flex-col'}>
              <textarea
                bind:this={textareaRef}
                value={langTab === 'en' ? content : contentId}
                oninput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
                ondrop={handleDrop}
                onpaste={handlePaste}
                placeholder={langTab === 'id' ? 'Mulai menulis dalam markdown... (ID)' : 'Start writing in markdown...'}
                spellcheck="false"
                class="editor-textarea editor-pane h-full w-full resize-none border-none bg-transparent p-4 font-mono text-sm leading-relaxed text-black outline-none dark:text-white"
              ></textarea>
            </div>
          {/if}
          {#if viewMode !== 'editor'}
            <div class={viewMode === 'split' ? 'prose-preview min-h-0 w-1/2 overflow-y-auto p-6' : 'prose-preview min-h-0 w-full overflow-y-auto p-6'}>
              {@html previewHtml}
            </div>
          {/if}
        </div>

      {:else if activeTab === 'glossary'}
        <div class="flex min-h-0 w-full flex-col">
          <!-- Glossary header -->
          <div class="flex shrink-0 items-center justify-between border-b border-black/10 px-4 py-2 dark:border-white/10">
            <h3 class="font-mono text-[11px] tracking-widest uppercase dark:text-white">
              Glossary — {langTab.toUpperCase()}
            </h3>
            <div class="flex items-center gap-2">
              <!-- Raw/Form toggle -->
              <div class="flex border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onclick={rawGlossMode ? toggleGlossRaw : undefined}
                  class={['px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-colors', !rawGlossMode ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white'].join(' ')}
                >Form</button>
                <button
                  type="button"
                  onclick={!rawGlossMode ? toggleGlossRaw : undefined}
                  class={['px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-colors', rawGlossMode ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white'].join(' ')}
                >Raw</button>
              </div>
              {#if !rawGlossMode}
                <button
                  onclick={() => addGlossEntry(langTab)}
                  class="bg-black px-3 py-1 text-xs font-bold tracking-wide text-white uppercase hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                >+ Add Entry</button>
              {/if}
            </div>
          </div>

          {#if rawGlossMode}
            <!-- Raw markdown textarea -->
            <div class="flex min-h-0 flex-1 flex-col p-3">
              <p class="mb-2 shrink-0 font-mono text-[10px] text-black/30 dark:text-white/30">
                Each entry: <code class="bg-black/5 px-1 dark:bg-white/5">key :: Term Name</code> on first line, definition below. Blank line between entries. Markdown supported.
              </p>
              <textarea
                bind:value={rawGlossText}
                spellcheck="false"
                placeholder={"my-term :: My Term Name\nDefinition supporting **markdown**.\n\nanother-term :: Another Term\nAnother definition."}
                class="editor-textarea min-h-0 flex-1 resize-none border border-black/10 bg-transparent p-3 font-mono text-sm leading-relaxed text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-white dark:focus:border-white/30"
              ></textarea>
              <button
                type="button"
                onclick={toggleGlossRaw}
                class="mt-2 shrink-0 self-start bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
              >Apply & switch to Form</button>
            </div>
          {:else}
            <!-- Form view -->
            <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
              {#each langTab === 'en' ? glossaryEn : glossaryId as entry, idx}
                <div class="mb-4 border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#111]">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="font-mono text-[10px] text-black/40 dark:text-white/40">Entry {idx + 1}</span>
                    <button onclick={() => removeGlossEntry(langTab, idx)} class="font-mono text-[10px] text-red-600 hover:underline">Remove</button>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Key</span>
                      <input value={entry.key} oninput={(e) => updateGlossEntry(langTab, idx, 'key', (e.target as HTMLInputElement).value)} class="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40" />
                    </div>
                    <div>
                      <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Term</span>
                      <input value={entry.term} oninput={(e) => updateGlossEntry(langTab, idx, 'term', (e.target as HTMLInputElement).value)} class="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40" />
                    </div>
                  </div>
                  <div class="mt-3">
                    <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Definition</span>
                    <textarea
                      value={entry.definition}
                      oninput={(e) => updateGlossEntry(langTab, idx, 'definition', (e.target as HTMLTextAreaElement).value)}
                      rows="3"
                      class="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs text-black/70 outline-none focus:border-black/30 dark:border-white/10 dark:text-white/70 dark:focus:border-white/30"
                    ></textarea>
                  </div>
                </div>
              {/each}
              {#if (langTab === 'en' ? glossaryEn : glossaryId).length === 0}
                <p class="font-mono text-xs text-black/40 dark:text-white/40">No glossary entries. Add one or switch to Raw mode.</p>
              {/if}
            </div>
          {/if}
        </div>

      {:else}
        <div class="flex min-h-0 w-full flex-col">
          <!-- Bibliography header -->
          <div class="flex shrink-0 items-center justify-between border-b border-black/10 px-4 py-2 dark:border-white/10">
            <h3 class="font-mono text-[11px] tracking-widest uppercase dark:text-white">
              Bibliography — {langTab.toUpperCase()}
            </h3>
            <div class="flex items-center gap-2">
              <div class="flex border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onclick={rawBibMode ? toggleBibRaw : undefined}
                  class={['px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-colors', !rawBibMode ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white'].join(' ')}
                >Form</button>
                <button
                  type="button"
                  onclick={!rawBibMode ? toggleBibRaw : undefined}
                  class={['px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-colors', rawBibMode ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white'].join(' ')}
                >Raw</button>
              </div>
              {#if !rawBibMode}
                <button
                  onclick={() => addBibEntry(langTab)}
                  class="bg-black px-3 py-1 text-xs font-bold tracking-wide text-white uppercase hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                >+ Add Entry</button>
              {/if}
            </div>
          </div>

          {#if rawBibMode}
            <div class="flex min-h-0 flex-1 flex-col p-3">
              <p class="mb-2 shrink-0 font-mono text-[10px] text-black/30 dark:text-white/30">
                Each entry: <code class="bg-black/5 px-1 dark:bg-white/5">key [sourceType]</code> on first line, citation text below. Blank line between entries. Types: {BIB_TYPES.join(', ')}.
              </p>
              <textarea
                bind:value={rawBibText}
                spellcheck="false"
                placeholder={"my-source [web]\nCitation text with **markdown** and a [link](url).\n\nanother-ref [book]\nAnother citation."}
                class="editor-textarea min-h-0 flex-1 resize-none border border-black/10 bg-transparent p-3 font-mono text-sm leading-relaxed text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-white dark:focus:border-white/30"
              ></textarea>
              <button
                type="button"
                onclick={toggleBibRaw}
                class="mt-2 shrink-0 self-start bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
              >Apply & switch to Form</button>
            </div>
          {:else}
            <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
              {#each langTab === 'en' ? bibliographyEn : bibliographyId as entry, idx}
                <div class="mb-4 border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#111]">
                  <div class="mb-2 flex items-center justify-between">
                    <span class="font-mono text-[10px] text-black/40 dark:text-white/40">Entry {idx + 1}</span>
                    <button onclick={() => removeBibEntry(langTab, idx)} class="font-mono text-[10px] text-red-600 hover:underline">Remove</button>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Key</span>
                      <input value={entry.key} oninput={(e) => updateBibEntry(langTab, idx, 'key', (e.target as HTMLInputElement).value)} class="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40" />
                    </div>
                    <div>
                      <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Source Type</span>
                      <select
                        value={entry.sourceType}
                        onchange={(e) => updateBibEntry(langTab, idx, 'sourceType', (e.target as HTMLSelectElement).value)}
                        class="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40"
                      >
                        {#each BIB_TYPES as t}
                          <option value={t}>{t}</option>
                        {/each}
                      </select>
                    </div>
                  </div>
                  <div class="mt-3">
                    <span class="mb-1 block font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Citation Text</span>
                    <textarea
                      value={entry.text}
                      oninput={(e) => updateBibEntry(langTab, idx, 'text', (e.target as HTMLTextAreaElement).value)}
                      rows="3"
                      class="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs text-black/70 outline-none focus:border-black/30 dark:border-white/10 dark:text-white/70 dark:focus:border-white/30"
                    ></textarea>
                  </div>
                </div>
              {/each}
              {#if (langTab === 'en' ? bibliographyEn : bibliographyId).length === 0}
                <p class="font-mono text-xs text-black/40 dark:text-white/40">No bibliography entries. Add one or switch to Raw mode.</p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Meta sidebar -->
    {#if showMeta}
      <div class="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-black/10 bg-[#f5f5f5] dark:border-white/10 dark:bg-[#0d0d0d]">
        <div class="flex flex-col gap-5 p-4">

          <!-- Slug -->
          <div class="flex flex-col gap-1.5">
            <label for="meta-slug" class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Slug</label>
            <input
              id="meta-slug"
              bind:value={slug}
              oninput={() => (slugTouched = true)}
              class="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40"
            />
          </div>

          <!-- Published at -->
          <div class="flex flex-col gap-1.5">
            <label for="meta-date" class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Published at</label>
            <input
              id="meta-date"
              type="date"
              bind:value={publishedAt}
              class="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40"
            />
          </div>

          <!-- Description -->
          <div class="flex flex-col gap-1.5">
            <label for="meta-desc" class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
              Description {langTab === 'id' ? '(ID)' : '(EN)'}
            </label>
            <textarea
              id="meta-desc"
              value={langTab === 'id' ? descriptionId : description}
              oninput={(e) =>
                langTab === 'id'
                  ? (descriptionId = (e.target as HTMLTextAreaElement).value)
                  : (description = (e.target as HTMLTextAreaElement).value)}
              placeholder={langTab === 'id' ? 'Deskripsi singkat... (ID)' : 'Short description...'}
              rows={3}
              class="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs text-black/70 placeholder-black/20 outline-none focus:border-black/30 dark:border-white/10 dark:text-white/70 dark:placeholder-white/20 dark:focus:border-white/30"
            ></textarea>
          </div>

          <!-- Cover image -->
          <div class="flex flex-col gap-1.5">
            <span class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Cover image</span>
            {#if coverImageUrl}
              <div class="group relative aspect-video w-full overflow-hidden border border-black/10 dark:border-white/10">
                <img src={coverImageUrl} alt="Cover" class="h-full w-full object-cover" />
                <div class="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                  <button type="button" onclick={() => (showCoverGallery = true)} title="Change cover" class="bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20">
                    <RefreshCw size={14} />
                  </button>
                  <button type="button" onclick={() => (coverImageUrl = '')} title="Remove cover" class="bg-white/10 p-1.5 text-white transition-colors hover:bg-red-500/60">
                    <X size={14} />
                  </button>
                </div>
              </div>
            {:else}
              <button
                type="button"
                onclick={() => (showCoverGallery = true)}
                class="flex aspect-video w-full flex-col items-center justify-center gap-1.5 border border-dashed border-black/20 text-black/30 transition-colors hover:border-black/40 hover:text-black/50 dark:border-white/20 dark:text-white/30 dark:hover:border-white/40 dark:hover:text-white/50"
              >
                <ImageIcon size={18} />
                <span class="font-mono text-[10px] tracking-widest uppercase">Select cover</span>
              </button>
            {/if}
          </div>

          <!-- Tags -->
          <div class="flex flex-col gap-2">
            <span class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Tags</span>
            <div class="flex flex-wrap gap-1.5">
              {#each allTags as tag (tag.id)}
                <button
                  type="button"
                  onclick={() => toggleTag(tag.id)}
                  class={[
                    'border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase transition-colors',
                    selectedTagIds.includes(tag.id)
                      ? 'border-black bg-black/10 text-black dark:border-white dark:bg-white/10 dark:text-white'
                      : 'border-black/20 text-black/30 hover:border-black/40 dark:border-white/20 dark:text-white/30 dark:hover:border-white/40',
                  ].join(' ')}
                >
                  #{tag.name}
                </button>
              {/each}
            </div>
            <input
              bind:value={newTagName}
              onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="+ new tag"
              class="w-full border-b border-black/10 bg-transparent pb-0.5 font-mono text-[10px] tracking-wide text-black/40 uppercase placeholder-black/20 outline-none focus:border-black/30 dark:border-white/10 dark:text-white/40 dark:placeholder-white/20 dark:focus:border-white/30"
            />
          </div>

          <!-- Heading outline -->
          {#if headings.length > 0}
            <div class="flex flex-col gap-1.5">
              <span class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">Outline</span>
              <div class="flex flex-col gap-0.5">
                {#each headings as h, i (i)}
                  <button
                    type="button"
                    onclick={() => jumpToHeading(h.index)}
                    style="padding-left: {(h.level - 1) * 8}px"
                    class="truncate text-left font-mono text-[10px] text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
                  >
                    {h.text}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Word count at bottom of sidebar -->
        <div class="mt-auto flex gap-3 border-t border-black/10 px-4 py-2.5 dark:border-white/10">
          <span class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">{wordCount} words</span>
          <span class="font-mono text-[10px] tracking-widest text-black/20 uppercase dark:text-white/20">{getContent().length} chars</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer status bar (hidden when meta open) -->
  {#if !showMeta}
    <div class="flex h-7 shrink-0 items-center gap-4 border-t border-black/10 bg-[#f5f5f5] px-4 dark:border-white/10 dark:bg-[#0d0d0d]">
      <span class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">{wordCount} words</span>
      <span class="font-mono text-[10px] tracking-widest text-black/20 uppercase dark:text-white/20">{getContent().length} chars</span>
    </div>
  {/if}
</div>
