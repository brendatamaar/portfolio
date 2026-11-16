<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { X } from 'lucide-svelte'
  import { parse } from '@portfolio/shared/markdown/parser'
  import { formatCitation } from '@portfolio/shared/markdown/citation'
  import type { GlossaryEntry, BibliographyEntry, PostTag } from '$lib/types'

  interface Props {
    onclose: () => void
    title: string
    description: string
    markdown: string
    coverImageUrl: string
    publishedAt: string
    status: 'draft' | 'published'
    tags: PostTag[]
    glossary: GlossaryEntry[]
    bibliography: BibliographyEntry[]
    lang: 'en' | 'id'
  }

  let {
    onclose,
    title,
    description,
    markdown,
    coverImageUrl,
    publishedAt,
    status,
    tags,
    glossary,
    bibliography,
    lang,
  }: Props = $props()

  // ----- helpers -----

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function getReadableText(value: string) {
    return value
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/^\[\^[^\]]+]:\s.*$/gm, ' ')
      .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
      .replace(/\[[^\]]+]\([^)]+\)/g, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#>*_~`[\]()\\-]/g, ' ')
      .trim()
  }

  // ----- numbered + sorted entries (matches React PostPreviewModalContent) -----
  // num is assigned by INSERTION order, then alphabetically sorted by term.
  // The original numbering must be preserved so [gloss:key] resolves correctly.

  let numberedGlossary = $derived(
    glossary
      .map((entry, index) => ({ ...entry, num: index + 1 }))
      .sort((a, b) => a.term.localeCompare(b.term)),
  )
  let numberedBibliography = $derived(
    bibliography.map((entry, index) => ({ ...entry, num: index + 1 })),
  )

  let glossMap = $derived(new Map(numberedGlossary.map((e) => [e.key, e.num])))
  let citeMap = $derived(new Map(numberedBibliography.map((e) => [e.key, e.num])))

  // ----- parse markdown -----

  let parsed = $derived.by(() => {
    try {
      return parse(markdown, { glossMap, citeMap })
    } catch {
      return { html: '<p style="color:#f87171">Parse error</p>', toc: [], sidenotes: [] }
    }
  })

  // Some glossary refs may not be wrapped by the parser (e.g. unknown contexts);
  // do a fallback pass so they still render as numbered superscripts.
  let renderedHtml = $derived(
    parsed.html.replace(/\[gloss:([^\]\s]+)\]/gi, (m, key: string) => {
      const num = glossMap.get(key)
      if (!num) return m
      return `<sup class="gloss-ref"><a data-gloss-key="${escapeHtml(key)}">${num}</a></sup>`
    }),
  )

  let readingTimeMinutes = $derived.by(() => {
    const parts = [
      markdown,
      ...parsed.sidenotes.map((s) => s.html),
      ...numberedGlossary.flatMap((g) => [g.term, g.definition]),
      ...numberedBibliography.map((b) => b.text),
    ]
    const words = parts.map(getReadableText).join(' ').split(/\s+/).filter(Boolean).length
    return words === 0 ? 0 : Math.max(1, Math.ceil(words / 200))
  })

  let dateLabel = $derived(
    publishedAt
      ? new Date(publishedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null,
  )

  // ----- DOM refs / state -----

  let modalRef = $state<HTMLDivElement | null>(null)
  let contentRef = $state<HTMLDivElement | null>(null)
  let sidenotesRef = $state<HTMLDivElement | null>(null)

  let glossaryOpen = $state(false)
  let bibliographyOpen = $state(false)

  // Inline popup state
  type PopupKind = 'gloss' | 'cite'
  let popupKind = $state<PopupKind | null>(null)
  let popupKey = $state<string | null>(null)
  let popupPos = $state<{ x: number; y: number; bottom: number } | null>(null)

  let popupGloss = $derived(
    popupKind === 'gloss' && popupKey !== null
      ? (numberedGlossary.find((g) => g.key === popupKey) ?? null)
      : null,
  )
  let popupCite = $derived(
    popupKind === 'cite' && popupKey !== null
      ? (numberedBibliography.find((b) => b.key === popupKey) ?? null)
      : null,
  )

  function closePopup() {
    popupKind = null
    popupKey = null
    popupPos = null
  }

  let popupStyle = $derived.by(() => {
    if (!popupPos) return ''
    const width = 320
    const margin = 8
    const left = Math.min(
      Math.max(popupPos.x - width / 2, 8),
      (typeof window !== 'undefined' ? window.innerWidth : 1024) - width - 8,
    )
    const flipBelow = popupPos.y < 120
    const top = flipBelow ? popupPos.bottom + margin : popupPos.y - margin
    const transform = flipBelow ? '' : 'translateY(-100%)'
    return `left:${left}px;top:${top}px;${transform ? `transform:${transform};` : ''}`
  })

  // ----- click handler on rendered content (delegates ref clicks to popups) -----

  function handleContentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null
    if (!target) return

    const glossTarget = target.closest('[data-gloss-key]') as HTMLElement | null
    const citeTarget = target.closest('[data-cite-id]') as HTMLElement | null
    const refTarget = glossTarget ?? citeTarget

    if (!refTarget) {
      // click anywhere else inside content/popup → close any open popup
      if (!target.closest('.post-preview-popup')) closePopup()
      return
    }

    event.preventDefault()
    const rect = refTarget.getBoundingClientRect()
    if (glossTarget) {
      const key = glossTarget.getAttribute('data-gloss-key')
      if (!key || !numberedGlossary.some((g) => g.key === key)) return
      popupKind = 'gloss'
      popupKey = key
    } else if (citeTarget) {
      const key = citeTarget.getAttribute('data-cite-id')
      if (!key || !numberedBibliography.some((b) => b.key === key)) return
      popupKind = 'cite'
      popupKey = key
    }
    popupPos = {
      x: rect.left + rect.width / 2,
      y: rect.top,
      bottom: rect.bottom,
    }
  }

  // ----- click an entry in the section list → scroll content to its ref + highlight -----

  function scrollToRef(selector: string) {
    const highlightClass = 'animate-ref-flash'
    if (!contentRef) return
    const el = contentRef.querySelector(selector) as HTMLElement | null
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add(highlightClass)
    setTimeout(() => el.classList.remove(highlightClass), 1500)
  }

  // ----- sidenote vertical positioning, mirrors React Sidenotes useEffect -----

  function positionSidenotes() {
    const container = sidenotesRef
    const content = contentRef
    if (!container || !content) return
    const containerTop = container.getBoundingClientRect().top + window.scrollY
    for (const { id } of parsed.sidenotes) {
      const refEl = content.querySelector(`[data-sidenote-id="${id}"]`) as HTMLElement | null
      const noteEl = container.querySelector(`[data-sidenote="${id}"]`) as HTMLElement | null
      if (!refEl || !noteEl) continue
      noteEl.style.top = `${refEl.getBoundingClientRect().top + window.scrollY - containerTop}px`
    }
  }

  // Reposition on sidenote/content changes and on window resize
  $effect(() => {
    void parsed.sidenotes
    void renderedHtml
    void tick().then(positionSidenotes)
  })

  // ----- mount: lock body scroll, autofocus for Esc, sidenote resize listener -----

  onMount(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    modalRef?.focus()

    const onResize = () => positionSidenotes()
    window.addEventListener('resize', onResize)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('resize', onResize)
    }
  })
</script>

<div
  bind:this={modalRef}
  role="dialog"
  aria-modal="true"
  aria-label="Post preview"
  tabindex="-1"
  class="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/70 p-4 backdrop-blur-sm"
  onmousedown={(e) => {
    if (e.target === e.currentTarget) onclose()
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (popupKind) closePopup()
      else onclose()
    }
  }}
>
  <div
    class="flex w-full max-w-5xl flex-col overflow-hidden rounded-[12px] border border-ring bg-page text-ink shadow-popup"
  >
    <!-- Header bar -->
    <div class="flex h-12 shrink-0 items-center justify-between border-b border-ring px-4 dark:border-white/10">
      <span class="text-[12px] text-quiet dark:text-quiet">
        {lang.toUpperCase()} Preview
      </span>
      <button
        type="button"
        onclick={onclose}
        aria-label="Close preview"
        class="p-1.5 text-quiet transition-colors hover:text-ink/40 dark:hover:text-ink"
      >
        <X size={16} />
      </button>
    </div>

    <!-- Scrollable body -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      {#if coverImageUrl}
        <div class="max-h-[360px] overflow-hidden border-b border-ring">
          <img src={coverImageUrl} alt="" class="h-full max-h-[360px] w-full object-cover" />
        </div>
      {/if}

      <!-- Title block -->
      <div class="mx-auto max-w-3xl px-6 py-10">
        {#if tags.length > 0}
          <div class="mb-5 flex flex-wrap gap-1.5">
            {#each tags as tag (tag.id)}
              <span class="border border-leader px-2 py-0.5 font-mono text-[11px] font-bold text-quiet dark:border-white/20 dark:text-white/50">
                #{tag.name}
              </span>
            {/each}
          </div>
        {/if}

        <h1 class="mb-4 text-[32px] leading-[1.15] font-medium tracking-[-0.01em] text-ink">
          {title || 'Untitled'}
        </h1>

        {#if description}
          <p class="mb-6 text-xl leading-relaxed text-body">
            {description}
          </p>
        {/if}

        <div class="flex items-center gap-3 border-b border-ring pb-8 text-[13px] text-quiet dark:border-white/10 dark:text-quiet">
          {#if dateLabel}<span>{dateLabel}</span>{/if}
          <span>{status}</span>
        </div>
      </div>

      <!-- 3-column body: sidenotes | content + reading time | TOC -->
      <main class="mx-auto max-w-[72rem] px-6 pb-12">
        <div class="flex w-full items-start gap-10">
          <!-- Sidenotes (left) -->
          {#if parsed.sidenotes.length > 0}
            <div bind:this={sidenotesRef} class="relative hidden w-52 shrink-0 lg:block" aria-label="Sidenotes">
              {#each parsed.sidenotes as note (note.id)}
                <aside
                  data-sidenote={note.id}
                  class="absolute right-0 left-0 border-l-2 border-leader pl-3 text-[11px] leading-relaxed text-quiet dark:border-white/20 dark:text-white/50"
                >
                  <sup class="mr-1 font-bold">[{note.id}]</sup>
                  {@html note.html}
                </aside>
              {/each}
            </div>
          {/if}

          <!-- Main content + reading time -->
          <div class="min-w-0 flex-1">
            <div class="mb-8 border-b border-ring pb-4 text-[13px] text-quiet dark:border-white/10 dark:text-quiet">
              {readingTimeMinutes} min read
            </div>
            <div
              bind:this={contentRef}
              class="post-preview-content"
              onclick={handleContentClick}
              role="presentation"
            >
              {@html renderedHtml}
            </div>
          </div>

          <!-- TOC (right, sticky) -->
          {#if parsed.toc.length > 0}
            <nav class="sticky top-8 hidden w-48 shrink-0 lg:block" aria-label="Table of contents">
              <p class="mb-3 text-[12px] font-medium text-quiet dark:text-quiet">
                Contents
              </p>
              <ul class="space-y-1.5">
                {#each parsed.toc as item (item.id)}
                  <li>
                    <a
                      href={`#${item.id}`}
                      class="block text-[12px] leading-snug text-quiet transition-colors hover:text-ink/40 dark:hover:text-ink"
                    >
                      {item.text}
                    </a>
                  </li>
                {/each}
              </ul>
            </nav>
          {/if}
        </div>
      </main>

      <!-- Glossary / Bibliography sections -->
      <div class="mx-auto max-w-3xl space-y-4 px-6 pb-12">
        {#if numberedGlossary.length > 0}
          <section class="border border-ring bg-page shadow-card dark:border-white dark:bg-ink dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <button
              type="button"
              onclick={() => (glossaryOpen = !glossaryOpen)}
              aria-expanded={glossaryOpen}
              class="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-pen/10"
            >
              <span class="flex items-center gap-3">
                <span class="font-mono text-[11px] font-medium text-ink dark:text-white">Glossary</span>
                <span class="inline-flex items-center border border-ring bg-pen px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
                  {numberedGlossary.length}
                </span>
              </span>
              <span class="font-mono text-sm font-medium text-ink">{glossaryOpen ? '-' : '+'}</span>
            </button>
            {#if glossaryOpen}
              <div class="border-t border-ring px-5 py-4 dark:border-white">
                <dl class="m-0 space-y-3 p-0">
                  {#each numberedGlossary as entry (entry.key)}
                    <div
                      class="cursor-pointer border-l-3 border-[#FFE600] py-1 pl-4 transition-all hover:border-l-4 hover:bg-pen/5"
                      role="button"
                      tabindex="0"
                      onclick={() =>
                        scrollToRef(`[data-gloss-key="${entry.key}"]`)}
                      onkeydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          scrollToRef(`[data-gloss-key="${entry.key}"]`)
                        }
                      }}
                    >
                      <dt class="mb-1 flex items-baseline gap-2 font-mono text-[13px] font-bold text-ink">
                        <span class="inline-flex items-center bg-ink px-1.5 py-0.5 font-mono text-[11px] font-medium text-white dark:bg-ink dark:text-page">
                          {entry.num}
                        </span>
                        {entry.term}
                      </dt>
                      <dd class="m-0 pl-0 text-[14px] leading-relaxed text-body">
                        {entry.definition}
                      </dd>
                    </div>
                  {/each}
                </dl>
              </div>
            {/if}
          </section>
        {/if}

        {#if numberedBibliography.length > 0}
          <section class="border border-ring bg-page shadow-card dark:border-white dark:bg-ink dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <button
              type="button"
              onclick={() => (bibliographyOpen = !bibliographyOpen)}
              aria-expanded={bibliographyOpen}
              class="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-pen/10"
            >
              <span class="flex items-center gap-3">
                <span class="font-mono text-[11px] font-medium text-ink dark:text-white">Bibliography</span>
                <span class="inline-flex items-center border border-ring bg-pen px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
                  {numberedBibliography.length}
                </span>
              </span>
              <span class="font-mono text-sm font-medium text-ink">{bibliographyOpen ? '-' : '+'}</span>
            </button>
            {#if bibliographyOpen}
              <div class="border-t border-ring px-5 py-4 dark:border-white">
                <ol class="m-0 list-none space-y-3 p-0">
                  {#each numberedBibliography as entry (entry.key)}
                    <li>
                      <div
                        class="flex cursor-pointer items-baseline gap-3 border-l-3 border-[#FFE600] py-1 pl-4 transition-all hover:border-l-4 hover:bg-pen/5"
                        role="button"
                        tabindex="0"
                        onclick={(e) => {
                          if ((e.target as HTMLElement).closest('a')) return
                          scrollToRef(`[data-cite-id="${entry.key}"]`)
                        }}
                        onkeydown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            scrollToRef(`[data-cite-id="${entry.key}"]`)
                          }
                        }}
                      >
                        <span class="inline-flex shrink-0 items-center border border-ring bg-pen px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink">
                          {entry.num}
                        </span>
                        <span class="text-[14px] leading-relaxed text-body">
                          {@html formatCitation(entry.text)}
                        </span>
                      </div>
                    </li>
                  {/each}
                </ol>
              </div>
            {/if}
          </section>
        {/if}
      </div>
    </div>
  </div>

  <!-- Inline popups (rendered at modal level so they escape the scroll container) -->
  {#if popupGloss && popupPos}
    <div class="post-preview-popup gloss-popup" style={popupStyle}>
      <div class="flex items-start justify-between gap-3">
        <div class="font-mono text-[0.8rem] font-bold">
          {popupGloss.term}
        </div>
        <button type="button" onclick={closePopup} aria-label="Close glossary popup">x</button>
      </div>
      <div>{popupGloss.definition}</div>
    </div>
  {/if}

  {#if popupCite && popupPos}
    <div class="post-preview-popup bib-popup" style={popupStyle}>
      <button type="button" class="float-right" onclick={closePopup} aria-label="Close bibliography popup">x</button>
      <div class="mb-2 border-l-3 border-[#FFE600] pl-2 font-mono text-[0.65rem] font-medium">
        {popupCite.sourceType}
      </div>
      <div>{@html formatCitation(popupCite.text)}</div>
    </div>
  {/if}
</div>
