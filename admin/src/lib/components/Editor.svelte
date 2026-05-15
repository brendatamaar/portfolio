<script lang="ts">
  import { api } from '$lib/api'
  import type { AdminPost, PostTag, GlossaryEntry, BibliographyEntry, BibSourceType, PostPayload } from '$lib/types'
  import ImageGallery from './ImageGallery.svelte'
  import Toast from './Toast.svelte'

  interface Props {
    post: AdminPost | null
    allTags: PostTag[]
  }
  let { post, allTags: initialTags }: Props = $props()

  // --- Form state ---
  let langTab = $state<'en' | 'id'>('en')
  let activeTab = $state<'content' | 'glossary' | 'bibliography'>('content')

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
      : new Date().toISOString().slice(0, 10)
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
  let toastRef = $state<{ show: (msg: string, type?: 'success' | 'error' | 'info', dur?: number) => void } | null>(null)

  // Auto-generate slug from title (only for new posts)
  $effect(() => {
    if (!postId && title) {
      slug = title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
    }
  })

  // --- Autosave ---
  let autosaveTimer = 0
  $effect(() => {
    // Track any content change
    const _ = [title, description, content, titleId, descriptionId, contentId, status, coverImageUrl, publishedAt, selectedTagIds.join(), JSON.stringify(glossaryEn), JSON.stringify(glossaryId), JSON.stringify(bibliographyEn), JSON.stringify(bibliographyId)]
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
      title, slug, description, content,
      titleId, descriptionId, contentId,
      status,
      coverImageUrl: coverImageUrl || null,
      tagIds: selectedTagIds,
      publishedAt: status === 'published' && publishedAt ? new Date(publishedAt).toISOString() : null,
      glossaryEn, glossaryId,
      bibliographyEn, bibliographyId,
    }
    try {
      if (postId) {
        await api.updatePost(postId, payload)
      } else {
        const created = await api.createPost(payload)
        postId = created.id
        // Update URL without navigating
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

  // --- Image insertion ---
  function insertAtCursor(text: string) {
    const el = textareaRef
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = el.value.slice(0, start) + text + el.value.slice(end)
    if (langTab === 'en') content = newVal
    else contentId = newVal
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length
      el.focus()
    })
  }

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
  function updateGlossEntry(lang: 'en' | 'id', idx: number, field: keyof GlossaryEntry, val: string) {
    if (lang === 'en') {
      glossaryEn = glossaryEn.map((e, i) => i === idx ? { ...e, [field]: val } : e)
    } else {
      glossaryId = glossaryId.map((e, i) => i === idx ? { ...e, [field]: val } : e)
    }
  }

  // --- Bibliography helpers ---
  const BIB_TYPES: BibSourceType[] = ['web', 'docs', 'journal', 'article', 'book', 'video', 'podcast', 'repo', 'other']
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
    if (lang === 'en') {
      bibliographyEn = bibliographyEn.map((e, i) => i === idx ? { ...e, [field]: val } : e)
    } else {
      bibliographyId = bibliographyId.map((e, i) => i === idx ? { ...e, [field]: val } : e)
    }
  }

  let savedAgoText = $derived(
    savedAt
      ? `Saved ${Math.round((Date.now() - savedAt.getTime()) / 1000)}s ago`
      : ''
  )

  // Keyboard shortcut: Ctrl+S
  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      save()
    }
  }

  const previewUrl = $derived(postId ? `${import.meta.env.VITE_SITE_URL ?? 'http://localhost:4321'}/blog/${slug}` : null)
</script>

<svelte:window onkeydown={handleKeydown} />

<Toast bind:this={toastRef} />
<ImageGallery open={showGallery} onselect={handleGallerySelect} onclose={() => (showGallery = false)} />

<div class="flex h-screen flex-col overflow-hidden">
  <!-- Toolbar -->
  <div class="flex items-center justify-between border-b-2 border-black bg-white px-4 py-2">
    <div class="flex items-center gap-4">
      <a href="/" class="text-xs font-bold uppercase tracking-widest hover:underline">← Posts</a>
      <span class="text-xs text-black/40">{savedAgoText}</span>
    </div>
    <div class="flex items-center gap-2">
      {#if previewUrl}
        <a href={previewUrl} target="_blank" class="border border-black px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-black/5">Preview</a>
      {/if}
      <button
        onclick={() => (showMeta = !showMeta)}
        class="border border-black px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-black/5"
      >
        Meta
      </button>
      <button
        onclick={() => save()}
        disabled={saving}
        class="border-2 border-black bg-[#ffe600] px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-black hover:text-[#ffe600] disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  </div>

  <!-- Meta drawer -->
  {#if showMeta}
    <div class="border-b-2 border-black bg-[#f9f9f9] px-6 py-5">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Slug</label>
          <input bind:value={slug} class="border-2 border-black bg-white px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Status</label>
          <select bind:value={status} class="border-2 border-black bg-white px-2 py-1.5 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Published At</label>
          <input type="date" bind:value={publishedAt} class="border-2 border-black bg-white px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Cover Image</label>
          <div class="flex gap-1">
            <input bind:value={coverImageUrl} placeholder="URL" class="border-2 border-black bg-white px-2 py-1.5 text-xs" />
            <button
              onclick={() => { galleryTarget = 'cover'; showGallery = true }}
              class="shrink-0 border-2 border-black bg-white px-2 py-1.5 text-xs font-bold hover:bg-black/5"
            >Pick</button>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="mt-4">
        <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Tags</label>
        <div class="flex flex-wrap gap-2">
          {#each allTags as tag (tag.id)}
            <button
              onclick={() => toggleTag(tag.id)}
              class="border-2 border-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest transition-colors {selectedTagIds.includes(tag.id) ? 'bg-black text-white' : 'bg-white hover:bg-black/5'}"
            >
              {tag.name}
            </button>
          {/each}
          <div class="flex gap-1">
            <input
              bind:value={newTagName}
              placeholder="New tag…"
              class="border-2 border-black bg-white px-2 py-0.5 text-[11px] w-28"
              onkeydown={(e) => e.key === 'Enter' && addTag()}
            />
            <button onclick={addTag} class="border-2 border-black bg-white px-2 py-0.5 text-[11px] font-bold hover:bg-black/5">+</button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Lang tabs + content tabs -->
  <div class="flex items-center gap-0 border-b-2 border-black bg-white">
    <!-- Lang -->
    <div class="flex border-r-2 border-black">
      {#each (['en', 'id'] as const) as lang}
        <button
          onclick={() => (langTab = lang)}
          class="px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors {langTab === lang ? 'bg-black text-white' : 'hover:bg-black/5'}"
        >
          {lang.toUpperCase()}
        </button>
      {/each}
    </div>
    <!-- Content type tabs -->
    <div class="flex">
      {#each (['content', 'glossary', 'bibliography'] as const) as tab}
        <button
          onclick={() => (activeTab = tab)}
          class="px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors {activeTab === tab ? 'border-b-2 border-black font-black' : 'text-black/50 hover:text-black'}"
        >
          {tab}
        </button>
      {/each}
    </div>
  </div>

  <!-- Main area -->
  <div class="flex min-h-0 flex-1">
    {#if activeTab === 'content'}
      <!-- Title + Description -->
      <div class="flex w-full flex-col">
        <div class="border-b-2 border-black bg-white px-4 py-3">
          <input
            bind:value={langTab === 'en' ? title : titleId}
            oninput={(e) => { if (langTab === 'en') title = (e.target as HTMLInputElement).value; else titleId = (e.target as HTMLInputElement).value }}
            placeholder={langTab === 'en' ? 'Title (EN)' : 'Title (ID)'}
            class="w-full border-none bg-transparent text-2xl font-black outline-none placeholder:text-black/20"
          />
          <input
            bind:value={langTab === 'en' ? description : descriptionId}
            oninput={(e) => { if (langTab === 'en') description = (e.target as HTMLInputElement).value; else descriptionId = (e.target as HTMLInputElement).value }}
            placeholder={langTab === 'en' ? 'Description (EN)' : 'Description (ID)'}
            class="mt-1 w-full border-none bg-transparent text-sm text-black/60 outline-none placeholder:text-black/20"
          />
        </div>

        <!-- Editor / Preview split -->
        <div class="flex min-h-0 flex-1">
          <!-- Toolbar strip -->
          <div class="flex h-full flex-col border-r-2 border-black bg-[#f5f5f5]">
            <div class="flex flex-col gap-1 p-2">
              <button
                title="Insert image from gallery"
                onclick={() => { galleryTarget = 'content'; showGallery = true }}
                class="border border-black bg-white px-2 py-1 text-xs font-bold hover:bg-black hover:text-white"
              >
                IMG
              </button>
            </div>
          </div>

          <!-- Textarea -->
          <div class="flex min-h-0 flex-1 flex-col">
            <textarea
              bind:this={textareaRef}
              bind:value={langTab === 'en' ? content : contentId}
              oninput={(e) => { if (langTab === 'en') content = (e.target as HTMLTextAreaElement).value; else contentId = (e.target as HTMLTextAreaElement).value }}
              ondrop={handleDrop}
              onpaste={handlePaste}
              placeholder="Write markdown here… (drag/paste images to upload)"
              class="flex-1 resize-none border-none bg-white p-4 font-mono text-sm leading-relaxed outline-none"
              spellcheck="false"
            ></textarea>
          </div>
        </div>
      </div>

    {:else if activeTab === 'glossary'}
      <div class="flex-1 overflow-y-auto p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-black uppercase tracking-widest">
            Glossary — {langTab.toUpperCase()}
          </h3>
          <button
            onclick={() => addGlossEntry(langTab)}
            class="border-2 border-black bg-[#ffe600] px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-black hover:text-[#ffe600]"
          >
            + Add Entry
          </button>
        </div>
        {#each (langTab === 'en' ? glossaryEn : glossaryId) as entry, idx}
          <div class="mb-4 border-2 border-black bg-white p-4">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-bold text-black/40">Entry {idx + 1}</span>
              <button onclick={() => removeGlossEntry(langTab, idx)} class="text-xs font-bold text-red-600 hover:underline">Remove</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Key</label>
                <input value={entry.key} oninput={(e) => updateGlossEntry(langTab, idx, 'key', (e.target as HTMLInputElement).value)} class="border-2 border-black px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Term</label>
                <input value={entry.term} oninput={(e) => updateGlossEntry(langTab, idx, 'term', (e.target as HTMLInputElement).value)} class="border-2 border-black px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div class="mt-3">
              <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Definition</label>
              <textarea
                value={entry.definition}
                oninput={(e) => updateGlossEntry(langTab, idx, 'definition', (e.target as HTMLTextAreaElement).value)}
                rows="3"
                class="border-2 border-black px-2 py-1.5 text-sm"
              ></textarea>
            </div>
          </div>
        {/each}
        {#if (langTab === 'en' ? glossaryEn : glossaryId).length === 0}
          <p class="text-sm font-bold text-black/40">No glossary entries.</p>
        {/if}
      </div>

    {:else}
      <div class="flex-1 overflow-y-auto p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-black uppercase tracking-widest">
            Bibliography — {langTab.toUpperCase()}
          </h3>
          <button
            onclick={() => addBibEntry(langTab)}
            class="border-2 border-black bg-[#ffe600] px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] hover:bg-black hover:text-[#ffe600]"
          >
            + Add Entry
          </button>
        </div>
        {#each (langTab === 'en' ? bibliographyEn : bibliographyId) as entry, idx}
          <div class="mb-4 border-2 border-black bg-white p-4">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-bold text-black/40">Entry {idx + 1}</span>
              <button onclick={() => removeBibEntry(langTab, idx)} class="text-xs font-bold text-red-600 hover:underline">Remove</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Key</label>
                <input value={entry.key} oninput={(e) => updateBibEntry(langTab, idx, 'key', (e.target as HTMLInputElement).value)} class="border-2 border-black px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Source Type</label>
                <select value={entry.sourceType} onchange={(e) => updateBibEntry(langTab, idx, 'sourceType', (e.target as HTMLSelectElement).value)} class="border-2 border-black px-2 py-1.5 text-sm">
                  {#each BIB_TYPES as t}
                    <option value={t}>{t}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="mt-3">
              <label class="mb-1 block text-[10px] font-black uppercase tracking-widest">Citation Text</label>
              <textarea
                value={entry.text}
                oninput={(e) => updateBibEntry(langTab, idx, 'text', (e.target as HTMLTextAreaElement).value)}
                rows="3"
                class="border-2 border-black px-2 py-1.5 text-sm"
              ></textarea>
            </div>
          </div>
        {/each}
        {#if (langTab === 'en' ? bibliographyEn : bibliographyId).length === 0}
          <p class="text-sm font-bold text-black/40">No bibliography entries.</p>
        {/if}
      </div>
    {/if}
  </div>
</div>
