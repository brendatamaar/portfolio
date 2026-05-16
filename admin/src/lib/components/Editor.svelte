<script lang="ts">
  import { onMount, untrack } from 'svelte'
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
  import EditorHeader from './EditorHeader.svelte'
  import GlossaryPane from './GlossaryPane.svelte'
  import BibliographyPane from './BibliographyPane.svelte'
  import MetaSidebar from './MetaSidebar.svelte'
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

  // --- Editor state ---
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

  let textareaRef = $state<HTMLTextAreaElement | null>(null)
  let toastRef =
    $state<{ show: (msg: string, type?: 'success' | 'error' | 'info', dur?: number) => void } | null>(
      null,
    )

  // Auto-generate slug from title on new posts
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

  // Autosave after 5s of inactivity
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

  // --- Cursor manipulation ---
  function insertAtCursor(text: string) {
    const el = textareaRef
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    setContent(el.value.slice(0, start) + text + el.value.slice(end))
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
    setContent(el.value.slice(0, start) + replacement + el.value.slice(end))
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
    const start = el.selectionStart
    const lineStart = el.value.lastIndexOf('\n', start - 1) + 1
    setContent(el.value.slice(0, lineStart) + prefix + el.value.slice(lineStart))
    requestAnimationFrame(() => {
      if (!el) return
      el.selectionStart = el.selectionEnd = start + prefix.length
      el.focus()
    })
  }

  // --- Image handling ---
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
      case 's': e.preventDefault(); save(); break
      case 'b': e.preventDefault(); wrapSelection('**', '**', 'bold'); break
      case 'i': e.preventDefault(); wrapSelection('*', '*', 'italic'); break
      case 'k': e.preventDefault(); wrapSelection('[', '](url)', 'link text'); break
    }
  }

  // --- Live preview (debounced, skipped in editor-only mode) ---
  let previewHtml = $state('')
  let previewTimer = 0
  $effect(() => {
    const src = getContent()
    const mode = viewMode
    clearTimeout(previewTimer)
    if (mode === 'editor') return
    previewTimer = window.setTimeout(() => {
      try {
        previewHtml = parse(src, { glossMap: new Map(), citeMap: new Map() }).html
      } catch {
        previewHtml = ''
      }
    }, 150)
    return () => clearTimeout(previewTimer)
  })

  // --- Derived display values ---
  let savedAgoText = $derived(
    savedAt ? `Saved ${Math.round((Date.now() - savedAt.getTime()) / 1000)}s ago` : '',
  )
  let wordCount = $derived(getContent().trim() ? getContent().trim().split(/\s+/).length : 0)
  let headings = $derived(
    [...getContent().matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => ({
      level: m[1].length,
      text: m[2].trim(),
      index: m.index ?? 0,
    })),
  )
  let glossaryCount = $derived((langTab === 'id' ? glossaryId : glossaryEn).length)
  let bibliographyCount = $derived((langTab === 'id' ? bibliographyId : bibliographyEn).length)
  let previewUrl = $derived(
    postId ? `${import.meta.env.VITE_SITE_URL ?? 'http://localhost:4321'}/blog/${slug}` : null,
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

  function addGlossEntry() {
    const blank: GlossaryEntry = { key: '', term: '', definition: '' }
    if (langTab === 'en') glossaryEn = [...glossaryEn, blank]
    else glossaryId = [...glossaryId, blank]
  }
  function removeGlossEntry(idx: number) {
    if (langTab === 'en') glossaryEn = glossaryEn.filter((_, i) => i !== idx)
    else glossaryId = glossaryId.filter((_, i) => i !== idx)
  }
  function updateGlossEntry(idx: number, field: keyof GlossaryEntry, val: string) {
    if (langTab === 'en') glossaryEn = glossaryEn.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    else glossaryId = glossaryId.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
  }

  function addBibEntry() {
    const blank: BibliographyEntry = { key: '', text: '', sourceType: 'web' }
    if (langTab === 'en') bibliographyEn = [...bibliographyEn, blank]
    else bibliographyId = [...bibliographyId, blank]
  }
  function removeBibEntry(idx: number) {
    if (langTab === 'en') bibliographyEn = bibliographyEn.filter((_, i) => i !== idx)
    else bibliographyId = bibliographyId.filter((_, i) => i !== idx)
  }
  function updateBibEntry(idx: number, field: keyof BibliographyEntry, val: string) {
    if (langTab === 'en') bibliographyEn = bibliographyEn.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    else bibliographyId = bibliographyId.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
  }

  // --- Raw mode for glossary / bibliography ---
  // Glossary format:  "key :: Term\ndefinition…" (blank line between entries)
  // Bib format:       "key [sourceType]\ncitation text…"
  let rawGlossMode = $state(false)
  let rawBibMode = $state(false)
  let rawGlossText = $state('')
  let rawBibText = $state('')

  function glossToRaw(entries: GlossaryEntry[]): string {
    return entries.map((e) => `${e.key} :: ${e.term}\n${e.definition}`).join('\n\n')
  }
  function rawToGloss(raw: string): GlossaryEntry[] {
    return raw.split(/\n{2,}/).flatMap((block) => {
      const trimmed = block.trim()
      if (!trimmed) return []
      const lines = trimmed.split('\n')
      const first = lines[0] ?? ''
      const sep = first.indexOf(' :: ')
      const key = sep >= 0 ? first.slice(0, sep).trim() : first.trim()
      const term = sep >= 0 ? first.slice(sep + 4).trim() : ''
      return [{ key, term, definition: lines.slice(1).join('\n').trim() }]
    })
  }
  function bibToRaw(entries: BibliographyEntry[]): string {
    return entries.map((e) => `${e.key} [${e.sourceType}]\n${e.text}`).join('\n\n')
  }
  function rawToBib(raw: string): BibliographyEntry[] {
    return raw.split(/\n{2,}/).flatMap((block) => {
      const trimmed = block.trim()
      if (!trimmed) return []
      const lines = trimmed.split('\n')
      const first = lines[0] ?? ''
      const m = first.match(/^(.+?)\s+\[(\w+)\]$/)
      return [{ key: m ? m[1].trim() : first.trim(), sourceType: (m ? m[2] : 'web') as BibSourceType, text: lines.slice(1).join('\n').trim() }]
    })
  }

  function toggleGlossRaw() {
    if (!rawGlossMode) {
      rawGlossText = glossToRaw(langTab === 'en' ? glossaryEn : glossaryId)
    } else {
      const parsed = rawToGloss(rawGlossText)
      if (langTab === 'en') glossaryEn = parsed
      else glossaryId = parsed
    }
    rawGlossMode = !rawGlossMode
  }
  function toggleBibRaw() {
    if (!rawBibMode) {
      rawBibText = bibToRaw(langTab === 'en' ? bibliographyEn : bibliographyId)
    } else {
      const parsed = rawToBib(rawBibText)
      if (langTab === 'en') bibliographyEn = parsed
      else bibliographyId = parsed
    }
    rawBibMode = !rawBibMode
  }

  // Reset raw modes when switching language
  $effect(() => {
    const _lang = langTab
    rawGlossMode = false
    rawBibMode = false
  })
</script>

<svelte:window onkeydown={handleKeydown} />
<Toast bind:this={toastRef} />
<ImageGallery open={showGallery} onselect={handleGallerySelect} onclose={() => (showGallery = false)} />
<ImageGallery
  open={showCoverGallery}
  onselect={(url) => { coverImageUrl = url; showCoverGallery = false }}
  onclose={() => (showCoverGallery = false)}
/>

<div class="flex h-screen flex-col overflow-hidden bg-white text-black dark:bg-[#0a0a0a] dark:text-white">

  <EditorHeader
    {langTab} {title} {titleId} {status} {saving} {saveMsg} {savedAgoText} {previewUrl} {dark}
    onLangChange={(l) => (langTab = l)}
    onTitleInput={(val) => { if (langTab === 'id') titleId = val; else title = val }}
    onSave={() => save()}
    onPublish={() => save(false, 'published')}
    onUnpublish={() => save(false, 'draft')}
    onToggleTheme={toggleTheme}
  />

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

  {#if activeTab === 'content'}
    <Toolbar
      {viewMode}
      onViewMode={(m) => (viewMode = m)}
      onFormat={wrapSelection}
      onLinePrefix={insertLinePrefix}
      onInsert={insertAtCursor}
      onGallery={() => (showGallery = true)}
      onMetaToggle={() => (showMeta = !showMeta)}
      metaOpen={showMeta}
    />
  {/if}

  <div class="flex min-h-0 flex-1">
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
        <GlossaryPane
          lang={langTab}
          entries={langTab === 'en' ? glossaryEn : glossaryId}
          rawMode={rawGlossMode}
          rawText={rawGlossText}
          onadd={addGlossEntry}
          onremove={removeGlossEntry}
          onupdate={updateGlossEntry}
          ontoggleraw={toggleGlossRaw}
          onrawchange={(val) => (rawGlossText = val)}
        />
      {:else}
        <BibliographyPane
          lang={langTab}
          entries={langTab === 'en' ? bibliographyEn : bibliographyId}
          rawMode={rawBibMode}
          rawText={rawBibText}
          bibTypes={BIB_TYPES}
          onadd={addBibEntry}
          onremove={removeBibEntry}
          onupdate={updateBibEntry}
          ontoggleraw={toggleBibRaw}
          onrawchange={(val) => (rawBibText = val)}
        />
      {/if}
    </div>

    {#if showMeta}
      <MetaSidebar
        lang={langTab}
        {slug} {publishedAt} {description} {descriptionId}
        {coverImageUrl} {allTags} {selectedTagIds} {newTagName}
        {headings} {wordCount} charCount={getContent().length}
        onSlugInput={(val) => (slug = val)}
        onSlugTouch={() => (slugTouched = true)}
        onPublishedAtChange={(val) => (publishedAt = val)}
        onDescriptionInput={(val) => { if (langTab === 'id') descriptionId = val; else description = val }}
        onCoverSelect={() => (showCoverGallery = true)}
        onCoverRemove={() => (coverImageUrl = '')}
        onToggleTag={toggleTag}
        onNewTagNameChange={(val) => (newTagName = val)}
        onAddTag={addTag}
        onJumpToHeading={jumpToHeading}
      />
    {/if}
  </div>

  {#if !showMeta}
    <div class="flex h-7 shrink-0 items-center gap-4 border-t border-black/10 bg-[#f5f5f5] px-4 dark:border-white/10 dark:bg-[#0d0d0d]">
      <span class="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">{wordCount} words</span>
      <span class="font-mono text-[10px] tracking-widest text-black/20 uppercase dark:text-white/20">{getContent().length} chars</span>
    </div>
  {/if}
</div>
