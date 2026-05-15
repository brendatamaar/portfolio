<script lang="ts">
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

  // --- Form state ---
  let langTab = $state<'en' | 'id'>('en')
  let activeTab = $state<'content' | 'glossary' | 'bibliography'>('content')
  let viewMode = $state<ViewMode>('editor')

  let title = $state(post?.title ?? '')
  let slug = $state(post?.slug ?? '')
  let description = $state(post?.description ?? '')
  let content = $state(post?.content ?? '')
  let titleId = $state(post?.titleId ?? '')
  let descriptionId = $state(post?.descriptionId ?? '')
  let contentId = $state(post?.contentId ?? '')
  let status = $state<'draft' | 'published'>(post?.status ?? 'draft')
  let coverImageUrl = $state(post?.coverImageUrl ?? '')
  let publishedAt = $state(
    post?.publishedAt
      ? new Date(post.publishedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  )

  let selectedTagIds = $state<number[]>(post?.tags.map((t) => t.id) ?? [])
  let allTags = $state<PostTag[]>(initialTags)
  let newTagName = $state('')

  let glossaryEn = $state<GlossaryEntry[]>(post?.glossaryEn ?? [])
  let glossaryId = $state<GlossaryEntry[]>(post?.glossaryId ?? [])
  let bibliographyEn = $state<BibliographyEntry[]>(post?.bibliographyEn ?? [])
  let bibliographyId = $state<BibliographyEntry[]>(post?.bibliographyId ?? [])

  let saving = $state(false)
  let savedAt = $state<Date | null>(null)
  let postId = $state<number | null>(post?.id ?? null)

  let showMeta = $state(false)
  let showGallery = $state(false)
  let galleryTarget = $state<'content' | 'cover'>('content')

  let textareaRef = $state<HTMLTextAreaElement | null>(null)
  let toastRef =
    $state<{ show: (msg: string, type?: 'success' | 'error' | 'info', dur?: number) => void } | null>(
      null,
    )

  // Auto-generate slug from title (only for new posts)
  $effect(() => {
    if (!postId && title) {
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
      title,
      description,
      content,
      titleId,
      descriptionId,
      contentId,
      status,
      coverImageUrl,
      publishedAt,
      selectedTagIds.join(),
      JSON.stringify(glossaryEn),
      JSON.stringify(glossaryId),
      JSON.stringify(bibliographyEn),
      JSON.stringify(bibliographyId),
    ]
    clearTimeout(autosaveTimer)
    autosaveTimer = window.setTimeout(() => save(true), 5000)
    return () => clearTimeout(autosaveTimer)
  })

  async function save(silent = false) {
    if (!title.trim()) {
      if (!silent) toastRef?.show('Title is required', 'error')
      return
    }
    saving = true
    const payload: PostPayload = {
      title,
      slug,
      description,
      content,
      titleId,
      descriptionId,
      contentId,
      status,
      coverImageUrl: coverImageUrl || null,
      tagIds: selectedTagIds,
      publishedAt:
        status === 'published' && publishedAt ? new Date(publishedAt).toISOString() : null,
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
      savedAt = new Date()
      if (!silent) toastRef?.show('Saved!', 'success')
    } catch (e) {
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
    if (galleryTarget === 'cover') {
      coverImageUrl = url
    } else {
      insertAtCursor(`\n![](${url})\n`)
    }
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

  // --- Download as Markdown ---
  function downloadMarkdown() {
    const currentTitle = langTab === 'en' ? title : titleId
    const currentDesc = langTab === 'en' ? description : descriptionId
    const currentContent = langTab === 'en' ? content : contentId
    const tagNames = allTags
      .filter((t) => selectedTagIds.includes(t.id))
      .map((t) => t.name)
      .join(', ')

    const fm = [
      '---',
      `title: "${currentTitle}"`,
      `slug: "${slug}"`,
      currentDesc ? `description: "${currentDesc}"` : '',
      `status: ${status}`,
      `language: ${langTab}`,
      tagNames ? `tags: [${tagNames}]` : '',
      '---',
    ]
      .filter(Boolean)
      .join('\n')

    const md = fm + '\n\n' + currentContent
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug || 'post'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Glossary helpers ---
  function addGlossEntry(lang: 'en' | 'id') {
    const blank: GlossaryEntry = { key: '', term: '', definition: '' }
    if (lang === 'en') glossaryEn = [...glossaryEn, blank]
    else glossaryId = [...glossaryId, blank]
  }
  function removeGlossEntry(lang: 'en' | 'id', idx: number) {
    if (lang === 'en') glossaryEn = glossaryEn.filter((_, i) => i !== idx)
    else glossaryId = glossaryId.filter((_, i) => i !== idx)
  }
  function updateGlossEntry(
    lang: 'en' | 'id',
    idx: number,
    field: keyof GlossaryEntry,
    val: string,
  ) {
    if (lang === 'en') {
      glossaryEn = glossaryEn.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    } else {
      glossaryId = glossaryId.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    }
  }

  // --- Bibliography helpers ---
  const BIB_TYPES: BibSourceType[] = [
    'web',
    'docs',
    'journal',
    'article',
    'book',
    'video',
    'podcast',
    'repo',
    'other',
  ]
  function addBibEntry(lang: 'en' | 'id') {
    const blank: BibliographyEntry = { key: '', text: '', sourceType: 'web' }
    if (lang === 'en') bibliographyEn = [...bibliographyEn, blank]
    else bibliographyId = [...bibliographyId, blank]
  }
  function removeBibEntry(lang: 'en' | 'id', idx: number) {
    if (lang === 'en') bibliographyEn = bibliographyEn.filter((_, i) => i !== idx)
    else bibliographyId = bibliographyId.filter((_, i) => i !== idx)
  }
  function updateBibEntry(
    lang: 'en' | 'id',
    idx: number,
    field: keyof BibliographyEntry,
    val: string,
  ) {
    if (lang === 'en') {
      bibliographyEn = bibliographyEn.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
    } else {
      bibliographyId = bibliographyId.map((e, i) => (i === idx ? { ...e, [field]: val } : e))
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

  let savedAgoText = $derived(
    savedAt ? `Saved ${Math.round((Date.now() - savedAt.getTime()) / 1000)}s ago` : '',
  )

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

  const previewUrl = $derived(
    postId ? `${import.meta.env.VITE_SITE_URL ?? 'http://localhost:4321'}/blog/${slug}` : null,
  )
</script>

<svelte:window onkeydown={handleKeydown} />

<Toast bind:this={toastRef} />
<ImageGallery open={showGallery} onselect={handleGallerySelect} onclose={() => (showGallery = false)} />

<div class="flex h-screen flex-col overflow-hidden bg-white dark:bg-[#111]">
  <!-- Top bar -->
  <div
    class="flex items-center justify-between border-b-2 border-black bg-white px-4 py-2 dark:border-white dark:bg-[#111]"
  >
    <div class="flex items-center gap-4">
      <a
        href="/"
        class="text-xs font-bold uppercase tracking-widest hover:underline dark:text-white"
        >← Posts</a
      >
      <span class="text-xs text-black/40 dark:text-white/40">{savedAgoText}</span>
    </div>
    <div class="flex items-center gap-2">
      {#if previewUrl}
        <a
          href={previewUrl}
          target="_blank"
          class="border border-black px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-black/5 dark:border-white dark:text-white dark:hover:bg-white/10"
          >Preview</a
        >
      {/if}
      <button
        onclick={() => (showMeta = !showMeta)}
        class="border border-black px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-black/5 dark:border-white dark:text-white dark:hover:bg-white/10"
      >
        Meta
      </button>
      <button
        onclick={() => save()}
        disabled={saving}
        class="border-2 border-black bg-[#ffe600] px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-black hover:text-[#ffe600] disabled:opacity-50 dark:shadow-[2px_2px_0px_#fff]"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  </div>

  <!-- Meta drawer -->
  {#if showMeta}
    <div
      class="border-b-2 border-black bg-[#f9f9f9] px-6 py-5 dark:border-white dark:bg-[#1a1a1a]"
    >
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <label class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
            >Slug</label
          >
          <input
            bind:value={slug}
            class="border-2 border-black bg-white px-2 py-1.5 text-sm dark:border-white dark:bg-[#111] dark:text-white"
          />
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
            >Status</label
          >
          <select
            bind:value={status}
            class="border-2 border-black bg-white px-2 py-1.5 text-sm dark:border-white dark:bg-[#111] dark:text-white"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
            >Published At</label
          >
          <input
            type="date"
            bind:value={publishedAt}
            class="border-2 border-black bg-white px-2 py-1.5 text-sm dark:border-white dark:bg-[#111] dark:text-white"
          />
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
            >Cover Image</label
          >
          <div class="flex gap-1">
            <input
              bind:value={coverImageUrl}
              placeholder="URL"
              class="border-2 border-black bg-white px-2 py-1.5 text-xs dark:border-white dark:bg-[#111] dark:text-white"
            />
            <button
              onclick={() => {
                galleryTarget = 'cover'
                showGallery = true
              }}
              class="shrink-0 border-2 border-black bg-white px-2 py-1.5 text-xs font-bold hover:bg-black/5 dark:border-white dark:bg-[#111] dark:text-white dark:hover:bg-white/10"
              >Pick</button
            >
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="mt-4">
        <label class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
          >Tags</label
        >
        <div class="flex flex-wrap gap-2">
          {#each allTags as tag (tag.id)}
            <button
              onclick={() => toggleTag(tag.id)}
              class="border-2 border-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest transition-colors {selectedTagIds.includes(tag.id)
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-white hover:bg-black/5 dark:border-white dark:bg-[#111] dark:text-white dark:hover:bg-white/10'}"
            >
              {tag.name}
            </button>
          {/each}
          <div class="flex gap-1">
            <input
              bind:value={newTagName}
              placeholder="New tag…"
              class="w-28 border-2 border-black bg-white px-2 py-0.5 text-[11px] dark:border-white dark:bg-[#111] dark:text-white"
              onkeydown={(e) => e.key === 'Enter' && addTag()}
            />
            <button
              onclick={addTag}
              class="border-2 border-black bg-white px-2 py-0.5 text-[11px] font-bold hover:bg-black/5 dark:border-white dark:bg-[#111] dark:text-white dark:hover:bg-white/10"
              >+</button
            >
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Lang tabs + content tabs -->
  <div
    class="flex items-center gap-0 border-b-2 border-black bg-white dark:border-white dark:bg-[#111]"
  >
    <div class="flex border-r-2 border-black dark:border-white">
      {#each (['en', 'id'] as const) as lang}
        <button
          onclick={() => (langTab = lang)}
          class="px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors {langTab === lang
            ? 'bg-black text-white dark:bg-white dark:text-black'
            : 'hover:bg-black/5 dark:text-white dark:hover:bg-white/10'}"
        >
          {lang.toUpperCase()}
        </button>
      {/each}
    </div>
    <div class="flex">
      {#each (['content', 'glossary', 'bibliography'] as const) as tab}
        <button
          onclick={() => (activeTab = tab)}
          class="px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors {activeTab === tab
            ? 'border-b-2 border-black font-black dark:border-white dark:text-white'
            : 'text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white'}"
        >
          {tab}
        </button>
      {/each}
    </div>
  </div>

  <!-- Main area -->
  <div class="flex min-h-0 flex-1">
    {#if activeTab === 'content'}
      <div class="flex w-full flex-col">
        <!-- Formatting toolbar -->
        <Toolbar
          {viewMode}
          onViewMode={(m) => (viewMode = m)}
          onFormat={wrapSelection}
          onLinePrefix={insertLinePrefix}
          onInsert={insertAtCursor}
          onGallery={() => {
            galleryTarget = 'content'
            showGallery = true
          }}
          onDownload={downloadMarkdown}
        />

        <!-- Title + Description -->
        <div
          class="border-b-2 border-black bg-white px-4 py-3 dark:border-white dark:bg-[#111]"
        >
          <input
            value={langTab === 'en' ? title : titleId}
            oninput={(e) => {
              if (langTab === 'en') title = (e.target as HTMLInputElement).value
              else titleId = (e.target as HTMLInputElement).value
            }}
            placeholder={langTab === 'en' ? 'Title (EN)' : 'Title (ID)'}
            class="w-full border-none bg-transparent text-2xl font-black outline-none placeholder:text-black/20 dark:text-white dark:placeholder:text-white/20"
          />
          <input
            value={langTab === 'en' ? description : descriptionId}
            oninput={(e) => {
              if (langTab === 'en') description = (e.target as HTMLInputElement).value
              else descriptionId = (e.target as HTMLInputElement).value
            }}
            placeholder={langTab === 'en' ? 'Description (EN)' : 'Description (ID)'}
            class="mt-1 w-full border-none bg-transparent text-sm text-black/60 outline-none placeholder:text-black/20 dark:text-white/60 dark:placeholder:text-white/20"
          />
        </div>

        <!-- Editor / Preview split -->
        <div class="flex min-h-0 flex-1">
          {#if viewMode !== 'preview'}
            <textarea
              bind:this={textareaRef}
              value={langTab === 'en' ? content : contentId}
              oninput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
              ondrop={handleDrop}
              onpaste={handlePaste}
              placeholder="Write markdown here… (drag/paste images to upload)"
              spellcheck="false"
              class="min-h-0 resize-none border-none bg-white p-4 font-mono text-sm leading-relaxed outline-none dark:bg-[#0d0d0d] dark:text-white dark:caret-white {viewMode === 'split'
                ? 'w-1/2 border-r-2 border-black dark:border-white'
                : 'flex-1'}"
            ></textarea>
          {/if}
          {#if viewMode !== 'editor'}
            <div
              class="prose-preview flex-1 overflow-y-auto bg-white p-6 dark:bg-[#0d0d0d] dark:text-white"
            >
              {@html previewHtml}
            </div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'glossary'}
      <div class="flex-1 overflow-y-auto bg-[#f5f5f5] p-6 dark:bg-[#0a0a0a]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-black uppercase tracking-widest dark:text-white">
            Glossary — {langTab.toUpperCase()}
          </h3>
          <button
            onclick={() => addGlossEntry(langTab)}
            class="border-2 border-black bg-[#ffe600] px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-black hover:text-[#ffe600] dark:shadow-[2px_2px_0px_#fff]"
          >
            + Add Entry
          </button>
        </div>
        {#each langTab === 'en' ? glossaryEn : glossaryId as entry, idx}
          <div
            class="mb-4 border-2 border-black bg-white p-4 dark:border-white dark:bg-[#111]"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-bold text-black/40 dark:text-white/40">Entry {idx + 1}</span
              >
              <button
                onclick={() => removeGlossEntry(langTab, idx)}
                class="text-xs font-bold text-red-600 hover:underline">Remove</button
              >
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
                  >Key</label
                >
                <input
                  value={entry.key}
                  oninput={(e) =>
                    updateGlossEntry(langTab, idx, 'key', (e.target as HTMLInputElement).value)}
                  class="border-2 border-black px-2 py-1.5 text-sm dark:border-white"
                />
              </div>
              <div>
                <label
                  class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
                  >Term</label
                >
                <input
                  value={entry.term}
                  oninput={(e) =>
                    updateGlossEntry(langTab, idx, 'term', (e.target as HTMLInputElement).value)}
                  class="border-2 border-black px-2 py-1.5 text-sm dark:border-white"
                />
              </div>
            </div>
            <div class="mt-3">
              <label
                class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
                >Definition</label
              >
              <textarea
                value={entry.definition}
                oninput={(e) =>
                  updateGlossEntry(
                    langTab,
                    idx,
                    'definition',
                    (e.target as HTMLTextAreaElement).value,
                  )}
                rows="3"
                class="border-2 border-black px-2 py-1.5 text-sm dark:border-white"
              ></textarea>
            </div>
          </div>
        {/each}
        {#if (langTab === 'en' ? glossaryEn : glossaryId).length === 0}
          <p class="text-sm font-bold text-black/40 dark:text-white/40">No glossary entries.</p>
        {/if}
      </div>

    {:else}
      <div class="flex-1 overflow-y-auto bg-[#f5f5f5] p-6 dark:bg-[#0a0a0a]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-black uppercase tracking-widest dark:text-white">
            Bibliography — {langTab.toUpperCase()}
          </h3>
          <button
            onclick={() => addBibEntry(langTab)}
            class="border-2 border-black bg-[#ffe600] px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-black hover:text-[#ffe600] dark:shadow-[2px_2px_0px_#fff]"
          >
            + Add Entry
          </button>
        </div>
        {#each langTab === 'en' ? bibliographyEn : bibliographyId as entry, idx}
          <div
            class="mb-4 border-2 border-black bg-white p-4 dark:border-white dark:bg-[#111]"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-bold text-black/40 dark:text-white/40">Entry {idx + 1}</span
              >
              <button
                onclick={() => removeBibEntry(langTab, idx)}
                class="text-xs font-bold text-red-600 hover:underline">Remove</button
              >
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
                  >Key</label
                >
                <input
                  value={entry.key}
                  oninput={(e) =>
                    updateBibEntry(langTab, idx, 'key', (e.target as HTMLInputElement).value)}
                  class="border-2 border-black px-2 py-1.5 text-sm dark:border-white"
                />
              </div>
              <div>
                <label
                  class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
                  >Source Type</label
                >
                <select
                  value={entry.sourceType}
                  onchange={(e) =>
                    updateBibEntry(
                      langTab,
                      idx,
                      'sourceType',
                      (e.target as HTMLSelectElement).value,
                    )}
                  class="border-2 border-black px-2 py-1.5 text-sm dark:border-white"
                >
                  {#each BIB_TYPES as t}
                    <option value={t}>{t}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="mt-3">
              <label
                class="mb-1 block text-[10px] font-black uppercase tracking-widest dark:text-white"
                >Citation Text</label
              >
              <textarea
                value={entry.text}
                oninput={(e) =>
                  updateBibEntry(langTab, idx, 'text', (e.target as HTMLTextAreaElement).value)}
                rows="3"
                class="border-2 border-black px-2 py-1.5 text-sm dark:border-white"
              ></textarea>
            </div>
          </div>
        {/each}
        {#if (langTab === 'en' ? bibliographyEn : bibliographyId).length === 0}
          <p class="text-sm font-bold text-black/40 dark:text-white/40">No bibliography entries.</p>
        {/if}
      </div>
    {/if}
  </div>
</div>
