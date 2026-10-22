// Post-page features (share, scrollspy, sidenotes, code/image tools, reference
// popups, reading progress). Lazy-loaded: only pages with prose need them.
import { gsap } from 'gsap'
import { onPage, onScroll, scrollToTarget } from '../engine'
import { formatCitation } from '@portfolio/shared/markdown/citation'

export function registerPostFeatures() {
  postShare()
  postSpy()
  postNotes()
  postEnhance()
  postPopups()
  readingProgress()
}

function postShare() {
  onPage(() => {
    const btn = document.querySelector<HTMLButtonElement>('[data-share-btn]')
    const menu = document.querySelector<HTMLElement>('[data-share-menu]')
    if (!btn || !menu) return
    const off: (() => void)[] = []
    const setOpen = (open: boolean) => {
      menu.hidden = !open
      btn.setAttribute('aria-expanded', String(open))
    }
    const onBtn = () => setOpen(menu.hidden)
    btn.addEventListener('click', onBtn)
    off.push(() => btn.removeEventListener('click', onBtn))
    const onDoc = (e: Event) => {
      if (
        !(e.target as Node) ||
        !(btn.contains(e.target as Node) || menu.contains(e.target as Node))
      )
        setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    off.push(() => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    })
    const copy = menu.querySelector<HTMLButtonElement>('[data-share-copy]')
    if (copy) {
      let reset: ReturnType<typeof setTimeout> | undefined
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          copy.textContent = copy.dataset.copied ?? 'Copied!'
          setOpen(false)
          clearTimeout(reset)
          reset = setTimeout(() => {
            copy.textContent = copy.dataset.label ?? 'Copy link'
          }, 2000)
        } catch {
          /* clipboard unavailable: leave the menu as-is */
        }
      }
      copy.addEventListener('click', onCopy)
      off.push(() => {
        copy.removeEventListener('click', onCopy)
        clearTimeout(reset)
      })
    }
    const title = btn.dataset.title ?? document.title
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    }
    menu.querySelectorAll<HTMLButtonElement>('[data-share-to]').forEach((b) => {
      const onShare = () => {
        const url = urls[b.dataset.shareTo ?? '']
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
        setOpen(false)
      }
      b.addEventListener('click', onShare)
      off.push(() => b.removeEventListener('click', onShare))
    })
    return () => off.forEach((f) => f())
  })
}
function postSpy() {
  onPage(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'),
    )
    if (!links.length) return
    const headings = links
      .map((l) => document.getElementById(l.dataset.tocLink ?? ''))
      .filter((el): el is HTMLElement => !!el)
    let activeId: string | null = null
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target.id)
          else visible.delete(e.target.id)
        })
        const topmost = headings.find((el) => visible.has(el.id))
        if (topmost && topmost.id !== activeId) {
          activeId = topmost.id
          links.forEach((l) =>
            l.toggleAttribute('data-active', l.dataset.tocLink === activeId),
          )
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 },
    )
    headings.forEach((el) => observer.observe(el))
    const off: (() => void)[] = [() => observer.disconnect()]
    links.forEach((link) => {
      const onClick = (e: Event) => {
        const el = document.getElementById(link.dataset.tocLink ?? '')
        if (!el) return
        e.preventDefault()
        link.closest('details')?.removeAttribute('open')
        scrollToTarget(el)
        history.pushState(null, '', `#${el.id}`)
      }
      link.addEventListener('click', onClick)
      off.push(() => link.removeEventListener('click', onClick))
    })
    return () => off.forEach((f) => f())
  })
}
function postNotes() {
  onPage(() => {
    const col = document.querySelector<HTMLElement>('.post__notes-col')
    const prose = document.querySelector<HTMLElement>('.prose')
    if (!col || !prose) return
    const pairs = Array.from(
      col.querySelectorAll<HTMLElement>('[data-sidenote]'),
    )
      .map((noteEl) => ({
        noteEl,
        refEl: prose.querySelector<HTMLElement>(
          `[data-sidenote-id="${noteEl.dataset.sidenote}"]`,
        ),
      }))
      .filter(
        (p): p is { noteEl: HTMLElement; refEl: HTMLElement } => !!p.refEl,
      )
    if (!pairs.length) return
    const position = () => {
      if (col.offsetParent === null) return
      const colTop = col.getBoundingClientRect().top
      let minTop = 0
      pairs.forEach(({ noteEl, refEl }) => {
        const top = Math.max(refEl.getBoundingClientRect().top - colTop, minTop)
        noteEl.style.top = `${top}px`
        minTop = top + noteEl.offsetHeight + 12
      })
    }
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(position)
    }
    position()
    const observer = new ResizeObserver(schedule)
    observer.observe(prose)
    window.addEventListener('resize', schedule)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(raf)
    }
  })
}
function postEnhance() {
  onPage(() => {
    const prose = document.querySelector<HTMLElement>('.prose')
    if (!prose) return
    const off: (() => void)[] = []
    prose.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
      const host = pre.closest<HTMLElement>('.code-block') ?? pre
      if (host.querySelector('.copy-btn')) return
      if (host === pre) pre.style.position = 'relative'
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'copy-btn'
      btn.textContent = 'Copy'
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(
            pre.querySelector('code')?.textContent ?? '',
          )
          btn.textContent = 'Copied!'
          setTimeout(() => {
            btn.textContent = 'Copy'
          }, 2000)
        } catch {
          /* clipboard unavailable */
        }
      }
      btn.addEventListener('click', onCopy)
      off.push(() => btn.removeEventListener('click', onCopy))
      host.appendChild(btn)
    })
    let zoom: HTMLElement | null = null
    const closeZoom = () => {
      zoom?.remove()
      zoom = null
    }
    prose.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const onZoom = () => {
        closeZoom()
        zoom = document.createElement('div')
        zoom.className = 'post__zoom'
        zoom.setAttribute('role', 'dialog')
        zoom.setAttribute('aria-modal', 'true')
        const full = document.createElement('img')
        full.src = img.currentSrc || img.src
        full.alt = img.alt
        zoom.appendChild(full)
        zoom.addEventListener('click', closeZoom)
        document.body.appendChild(zoom)
      }
      img.addEventListener('click', onZoom)
      off.push(() => img.removeEventListener('click', onZoom))
    })
    const jump = (entry: HTMLElement, selector: string) => {
      const onJump = () => {
        const ref = prose.querySelector<HTMLElement>(selector)
        if (ref) scrollToTarget(ref)
      }
      entry.addEventListener('click', onJump)
      off.push(() => entry.removeEventListener('click', onJump))
    }
    document
      .querySelectorAll<HTMLElement>('[data-gloss-entry]')
      .forEach((entry) =>
        jump(entry, `[data-gloss-key="${entry.dataset.glossEntry}"]`),
      )
    document
      .querySelectorAll<HTMLElement>('[data-cite-entry]')
      .forEach((entry) =>
        jump(entry, `[data-cite-id="${entry.dataset.citeEntry}"]`),
      )
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom()
    }
    document.addEventListener('keydown', onKey)
    off.push(() => {
      document.removeEventListener('keydown', onKey)
      closeZoom()
    })
    return () => off.forEach((f) => f())
  })
}
// Post page: reference numbers open a popup modal (glossary, bibliography, sidenotes).
// Hover previews, click pins, Escape or an outside click closes — as on the live blog.
function postPopups() {
  onPage(() => {
    const island = document.getElementById('post-data')
    const prose = document.querySelector<HTMLElement>('.prose')
    if (!island || !prose) return
    const parse = <T>(raw: string | undefined): T[] => {
      try {
        return JSON.parse(raw ?? '[]') as T[]
      } catch {
        return []
      }
    }
    const glossary = new Map(
      parse<{ key: string; term: string; definition: string }>(
        island.dataset.glossary,
      ).map((g) => [g.key, g]),
    )
    const bibliography = new Map(
      parse<{ key: string; text: string; sourceType: string }>(
        island.dataset.bibliography,
      ).map((b) => [b.key, b]),
    )
    const sidenotes = new Map(
      parse<{ id: string; html: string }>(island.dataset.sidenotes).map((n) => [
        n.id,
        n,
      ]),
    )
    if (!glossary.size && !bibliography.size && !sidenotes.size) return

    const off: (() => void)[] = []
    let hoverEl: HTMLElement | null = null
    let hoverRef: HTMLElement | null = null
    let pinnedEl: HTMLElement | null = null
    let hideTimer: ReturnType<typeof setTimeout> | undefined

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
      const width = Math.min(400, window.innerWidth - 16)
      el.style.width = `${width}px`
      let left = rect.left + rect.width / 2 - width / 2
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
      el.style.left = `${left}px`
      if (rect.top < 220) {
        el.style.top = `${rect.bottom + 8}px`
      } else {
        el.style.top = `${rect.top - 8}px`
        el.style.transform = 'translateY(-100%)'
      }
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
    const closeBtn = `<button type="button" class="ref-popup__close" aria-label="Close">×</button>`
    const resolve = (ref: HTMLElement): string | null => {
      if (ref.dataset.glossKey) {
        const entry = glossary.get(ref.dataset.glossKey)
        return entry
          ? `<div class="ref-popup__head"><span class="ref-popup__term">${entry.term}</span>${closeBtn}</div><div>${entry.definition}</div>`
          : null
      }
      if (ref.dataset.citeId) {
        const entry = bibliography.get(ref.dataset.citeId)
        return entry
          ? `<div class="ref-popup__head"><span class="ref-popup__source">${entry.sourceType.toUpperCase()}</span>${closeBtn}</div><div>${formatCitation(entry.text)}</div>`
          : null
      }
      if (ref.dataset.sidenoteId) {
        const entry = sidenotes.get(ref.dataset.sidenoteId)
        return entry
          ? `<div class="ref-popup__head"><span class="ref-popup__source">Note ${entry.id}</span>${closeBtn}</div><div>${entry.html}</div>`
          : null
      }
      return null
    }
    const findRef = (e: Event) =>
      (e.target as HTMLElement).closest<HTMLElement>(
        '[data-gloss-key], [data-cite-id], [data-sidenote-id]',
      )

    const onOver = (e: Event) => {
      clearTimeout(hideTimer)
      const ref = findRef(e)
      if (ref?.dataset.sidenoteId) {
        removeHover()
        return
      }
      if (!ref) {
        if (hoverEl) hideTimer = setTimeout(removeHover, 150)
        return
      }
      if (ref === hoverRef) return
      const html = resolve(ref)
      if (!html) return
      removeHover()
      hoverEl = create(html, ref, false)
      hoverRef = ref
    }
    const onClick = (e: Event) => {
      const ref = findRef(e)
      if (!ref) {
        if (pinnedEl && !pinnedEl.contains(e.target as Node)) removePinned()
        return
      }
      // Sidenote refs only flash their note in place: no modal, no scrolling
      if (ref.dataset.sidenoteId) {
        e.preventDefault()
        const note =
          document.querySelector<HTMLElement>(
            `[data-sidenote="${ref.dataset.sidenoteId}"]`,
          ) ?? document.getElementById(`fn-${ref.dataset.sidenoteId}`)
        if (note) {
          note.classList.remove('is-lit')
          void note.offsetWidth
          note.classList.add('is-lit')
        }
        return
      }
      const html = resolve(ref)
      if (!html) return
      e.preventDefault()
      removePinned()
      removeHover()
      pinnedEl = create(html, ref, true)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        removeHover()
        removePinned()
      }
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    off.push(() => {
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
      clearTimeout(hideTimer)
      removeHover()
      removePinned()
    })
    return () => off.forEach((f) => f())
  })
}
function readingProgress() {
  onPage(() => {
    const bar = document.querySelector<HTMLElement>('[data-progress]')
    const prose = document.querySelector<HTMLElement>('.prose')
    if (!bar || !prose) return
    const set = gsap.quickSetter(bar, 'scaleX')
    const update = () => {
      const r = prose.getBoundingClientRect()
      const p = gsap.utils.clamp(0, 1, (innerHeight * 0.5 - r.top) / r.height)
      set(p)
    }
    update()
    const off = onScroll(update) // the engine publishes native scroll too under reduced motion
    return () => {
      off()
    }
  })
}
