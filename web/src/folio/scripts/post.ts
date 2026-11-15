// Post-page behaviour: copy link, code copy buttons, image zoom, glossary/bibliography
// jump-back, and the hover/click popup for glossary and citation numbers.
import { formatCitation } from '@portfolio/shared/markdown/citation'

const scrollTo = (el: Element) =>
  el.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'center',
  })

function flash(btn: HTMLElement, text: string, back: string) {
  btn.textContent = text
  setTimeout(() => (btn.textContent = back), 2000)
}

export function initPost() {
  const prose = document.querySelector<HTMLElement>('.prose')
  if (!prose) return

  // copy link
  const link = document.querySelector<HTMLButtonElement>('[data-copy-link]')
  link?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      flash(
        link,
        link.dataset.copied ?? 'Copied!',
        link.dataset.label ?? 'Copy link',
      )
    } catch {
      /* clipboard unavailable */
    }
  })

  // copy buttons on code blocks
  prose.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
    const host = pre.closest<HTMLElement>('.code-block') ?? pre
    if (host.querySelector('[data-copy-code]')) return
    if (host === pre) pre.style.position = 'relative'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.dataset.copyCode = ''
    btn.className =
      'absolute top-1 right-1.5 cursor-pointer bg-transparent px-1.5 py-1 font-sans text-[12px] leading-[normal] font-normal text-quiet hover:text-ink'
    btn.textContent = 'Copy'
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(
          pre.querySelector('code')?.textContent ?? '',
        )
        flash(btn, 'Copied!', 'Copy')
      } catch {
        /* clipboard unavailable */
      }
    })
    host.appendChild(btn)
  })

  // click an image to zoom; click or Escape to close
  let zoom: HTMLElement | null = null
  const closeZoom = () => {
    zoom?.remove()
    zoom = null
  }
  prose.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    img.addEventListener('click', () => {
      closeZoom()
      zoom = document.createElement('div')
      zoom.className =
        'fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/85 p-4'
      zoom.setAttribute('role', 'dialog')
      zoom.setAttribute('aria-modal', 'true')
      const full = document.createElement('img')
      full.src = img.currentSrc || img.src
      full.alt = img.alt
      full.className = 'max-h-full max-w-full rounded-[8px]'
      zoom.appendChild(full)
      zoom.addEventListener('click', closeZoom)
      document.body.appendChild(zoom)
    })
  })

  // glossary / bibliography entries jump back to where they are cited
  const jump = (attr: string, sel: (v: string) => string) =>
    document.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((entry) =>
      entry.addEventListener('click', () => {
        const ref = prose.querySelector(sel(entry.getAttribute(attr) ?? ''))
        if (ref) scrollTo(ref)
      }),
    )
  jump('data-gloss-entry', (v) => `[data-gloss-key="${v}"]`)
  jump('data-cite-entry', (v) => `[data-cite-id="${v}"]`)

  // wide screens: scrollspy for the side contents, and footnotes lined up in the margin
  const body = document.querySelector<HTMLElement>('[data-post-body]')
  const wide = matchMedia('(min-width: 1240px)')
  const tocLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'),
  )
  if (tocLinks.length) {
    const heads = tocLinks
      .map((l) => document.getElementById(l.dataset.tocLink ?? ''))
      .filter((el): el is HTMLElement => !!el)
    const visible = new Set<string>()
    let active = ''
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id)
          else visible.delete(e.target.id)
        }
        const top = heads.find((h) => visible.has(h.id))
        if (top && top.id !== active) {
          active = top.id
          tocLinks.forEach((l) =>
            l.toggleAttribute('data-active', l.dataset.tocLink === active),
          )
        }
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 },
    )
    heads.forEach((h) => spy.observe(h))
  }
  const notesCol = body?.querySelector<HTMLElement>('[data-sidenotes]')
  if (body && notesCol) {
    const pairs = Array.from(
      notesCol.querySelectorAll<HTMLElement>('[data-sidenote]'),
    )
      .map((note) => ({
        note,
        ref: prose.querySelector<HTMLElement>(
          `[data-sidenote-id="${note.dataset.sidenote}"]`,
        ),
      }))
      .filter((p): p is { note: HTMLElement; ref: HTMLElement } => !!p.ref)
    const place = () => {
      if (!wide.matches || !pairs.length) {
        delete body.dataset.side
        return
      }
      const colTop = notesCol.getBoundingClientRect().top
      let min = 0
      for (const { note, ref } of pairs) {
        const top = Math.max(ref.getBoundingClientRect().top - colTop, min)
        note.style.top = `${top}px`
        min = top + note.offsetHeight + 12
      }
      body.dataset.side = ''
    }
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(place)
    }
    place()
    new ResizeObserver(schedule).observe(prose)
    wide.addEventListener('change', schedule)
    document.fonts?.ready.then(schedule)
    // a footnote number flashes its margin note instead of jumping to the hidden inline copy
    prose.addEventListener('click', (e) => {
      const ref = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-sidenote-id]',
      )
      if (!ref || !('side' in body.dataset)) return
      e.preventDefault()
      const note = notesCol.querySelector<HTMLElement>(
        `[data-sidenote="${ref.dataset.sidenoteId}"]`,
      )
      if (!note) return
      delete note.dataset.lit
      void note.offsetWidth
      note.dataset.lit = ''
    })
  }

  // reference popups: hover previews, click pins, Escape or an outside click closes
  const island = document.getElementById('post-data')
  type Gloss = { key: string; term: string; definition: string }
  type Bib = { key: string; text: string; sourceType: string }
  let data: { glossary: Gloss[]; bibliography: Bib[] } = {
    glossary: [],
    bibliography: [],
  }
  try {
    data = JSON.parse(island?.textContent ?? '') as typeof data
  } catch {
    /* no popup data */
  }
  const glossary = new Map(data.glossary.map((g) => [g.key, g]))
  const bibliography = new Map(data.bibliography.map((b) => [b.key, b]))

  let hoverEl: HTMLElement | null = null
  let hoverRef: HTMLElement | null = null
  let pinnedEl: HTMLElement | null = null
  let hideTimer = 0
  const removeHover = () => {
    hoverEl?.remove()
    hoverEl = null
    hoverRef = null
  }
  const removePinned = () => {
    pinnedEl?.remove()
    pinnedEl = null
  }
  const place = (el: HTMLElement, ref: HTMLElement) => {
    const rect = ref.getBoundingClientRect()
    const width = Math.min(360, innerWidth - 32)
    el.style.width = `${width}px`
    el.style.left = `${Math.max(16, Math.min(rect.left + rect.width / 2 - width / 2, innerWidth - width - 16))}px`
    if (rect.top < 220) el.style.top = `${rect.bottom + 8}px`
    else {
      el.style.top = `${rect.top - 8}px`
      el.style.transform = 'translateY(-100%)'
    }
  }
  const head = (label: string) =>
    `<div class="mb-1 flex justify-between gap-3 font-medium text-ink"><span>${label}</span><button type="button" class="cursor-pointer bg-transparent px-1 py-0 text-[18px] leading-none text-quiet" data-close aria-label="Close">×</button></div>`
  const resolve = (ref: HTMLElement): string | null => {
    if (ref.dataset.glossKey) {
      const g = glossary.get(ref.dataset.glossKey)
      return g ? `${head(g.term)}<div>${g.definition}</div>` : null
    }
    if (ref.dataset.citeId) {
      const b = bibliography.get(ref.dataset.citeId)
      return b
        ? `${head(b.sourceType.toUpperCase())}<div>${formatCitation(b.text)}</div>`
        : null
    }
    return null
  }
  const create = (html: string, ref: HTMLElement, pinned: boolean) => {
    const el = document.createElement('div')
    el.className =
      'fixed z-40 rounded-[10px] border border-leader bg-page px-3.5 py-3 text-[14px] leading-[1.6] text-body shadow-popup'
    el.innerHTML = html
    if (!pinned) el.style.pointerEvents = 'none'
    place(el, ref)
    el.querySelector('[data-close]')?.addEventListener('click', removePinned)
    document.body.appendChild(el)
    return el
  }
  const findRef = (e: Event) =>
    (e.target as HTMLElement).closest<HTMLElement>(
      '[data-gloss-key], [data-cite-id]',
    )

  if (glossary.size || bibliography.size) {
    document.addEventListener('mouseover', (e) => {
      clearTimeout(hideTimer)
      const ref = findRef(e)
      if (!ref) {
        if (hoverEl) hideTimer = window.setTimeout(removeHover, 150)
        return
      }
      if (ref === hoverRef) return
      const html = resolve(ref)
      if (!html) return
      removeHover()
      hoverEl = create(html, ref, false)
      hoverRef = ref
    })
    document.addEventListener('click', (e) => {
      const ref = findRef(e)
      if (!ref) {
        if (pinnedEl && !pinnedEl.contains(e.target as Node)) removePinned()
        return
      }
      const html = resolve(ref)
      if (!html) return
      e.preventDefault()
      removePinned()
      removeHover()
      pinnedEl = create(html, ref, true)
    })
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    removeHover()
    removePinned()
    closeZoom()
  })
}
