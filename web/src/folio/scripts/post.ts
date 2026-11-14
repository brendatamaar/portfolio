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
    if (host.querySelector('.copy-btn')) return
    if (host === pre) pre.style.position = 'relative'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'copy-btn'
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
      zoom.className = 'zoom'
      zoom.setAttribute('role', 'dialog')
      zoom.setAttribute('aria-modal', 'true')
      const full = document.createElement('img')
      full.src = img.currentSrc || img.src
      full.alt = img.alt
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
  const body = document.querySelector<HTMLElement>('.post-body')
  const wide = matchMedia('(min-width: 1240px)')
  const tocLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.side-toc [data-toc-link]'),
  )
  if (tocLinks.length) {
    const heads = tocLinks
      .map((l) => document.getElementById(l.dataset.tocLink ?? ''))
      .filter((el): el is HTMLElement => !!el)
    const visible = new Set<string>()
    let active = ''
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          e.isIntersecting
            ? visible.add(e.target.id)
            : visible.delete(e.target.id)
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
  const notesCol = body?.querySelector<HTMLElement>('.side-notes')
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
        body.classList.remove('side')
        return
      }
      const colTop = notesCol.getBoundingClientRect().top
      let min = 0
      for (const { note, ref } of pairs) {
        const top = Math.max(ref.getBoundingClientRect().top - colTop, min)
        note.style.top = `${top}px`
        min = top + note.offsetHeight + 12
      }
      body.classList.add('side')
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
      if (!ref || !body.classList.contains('side')) return
      e.preventDefault()
      const note = notesCol.querySelector<HTMLElement>(
        `[data-sidenote="${ref.dataset.sidenoteId}"]`,
      )
      if (!note) return
      note.classList.remove('is-lit')
      void note.offsetWidth
      note.classList.add('is-lit')
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
  const closeBtn =
    '<button type="button" class="ref-popup__close" aria-label="Close">×</button>'
  const resolve = (ref: HTMLElement): string | null => {
    if (ref.dataset.glossKey) {
      const g = glossary.get(ref.dataset.glossKey)
      return g
        ? `<div class="ref-popup__head"><span>${g.term}</span>${closeBtn}</div><div>${g.definition}</div>`
        : null
    }
    if (ref.dataset.citeId) {
      const b = bibliography.get(ref.dataset.citeId)
      return b
        ? `<div class="ref-popup__head"><span>${b.sourceType.toUpperCase()}</span>${closeBtn}</div><div>${formatCitation(b.text)}</div>`
        : null
    }
    return null
  }
  const create = (html: string, ref: HTMLElement, pinned: boolean) => {
    const el = document.createElement('div')
    el.className = 'ref-popup'
    el.innerHTML = html
    if (!pinned) el.style.pointerEvents = 'none'
    place(el, ref)
    el.querySelector('.ref-popup__close')?.addEventListener(
      'click',
      removePinned,
    )
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
