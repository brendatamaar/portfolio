import type { GlossaryEntry, BibliographyEntry } from '../lib/types'

interface PopupDimensions {
  width: number
  margin: number
}

function computePopupStyle(
  x: number,
  y: number,
  bottom: number,
  dim: PopupDimensions,
): Partial<CSSStyleDeclaration> {
  let left = x - dim.width / 2
  if (left < 8) left = 8
  if (left + dim.width > window.innerWidth - 8)
    left = window.innerWidth - dim.width - 8

  const flipBelow = y < 200
  return {
    position: 'fixed',
    left: `${left}px`,
    top: flipBelow ? `${bottom + dim.margin}px` : `${y - dim.margin}px`,
    transform: flipBelow ? '' : 'translateY(-100%)',
    zIndex: '50',
  }
}

interface PopupConfig<T> {
  entries: Map<string, T>
  /** Selector matching reference elements in the article */
  selector: string
  /** Reads the entry key off a matched reference element */
  keyOf: (ref: HTMLElement) => string | undefined
  className: string
  closeClassName: string
  width: number
  /** Popup HTML; `closeBtn` is included only for the click-pinned popup */
  render: (entry: T, closeBtn: string) => string
}

/**
 * Hover shows a transient popup; click pins one with a close button.
 * Document listeners are removed when `signal` aborts (page navigation).
 */
function initPopups<T>(cfg: PopupConfig<T>, signal: AbortSignal) {
  let hoverEl: HTMLDivElement | null = null
  let hoverRef: HTMLElement | null = null
  let clickEl: HTMLDivElement | null = null
  let hideTimer = 0

  const removeHover = () => {
    hoverEl?.remove()
    hoverEl = null
    hoverRef = null
  }
  const removeClick = () => {
    clickEl?.remove()
    clickEl = null
  }

  const create = (entry: T, ref: HTMLElement, pinned: boolean) => {
    const rect = ref.getBoundingClientRect()
    const el = document.createElement('div')
    el.className = cfg.className
    el.innerHTML = cfg.render(
      entry,
      pinned
        ? `<button class="${cfg.closeClassName}" aria-label="Close">×</button>`
        : '',
    )
    if (!pinned) el.style.pointerEvents = 'none'
    Object.assign(
      el.style,
      computePopupStyle(rect.left + rect.width / 2, rect.top, rect.bottom, {
        width: cfg.width,
        margin: 8,
      }),
    )
    el.querySelector(`.${cfg.closeClassName}`)?.addEventListener(
      'click',
      removeClick,
    )
    document.body.appendChild(el)
    return el
  }

  const findRef = (e: Event) =>
    (e.target as HTMLElement).closest<HTMLElement>(cfg.selector)

  document.addEventListener(
    'mouseover',
    (e) => {
      const ref = findRef(e)
      clearTimeout(hideTimer)
      if (!ref) {
        if (hoverEl) hideTimer = window.setTimeout(removeHover, 150)
        return
      }
      // mouseover bubbles from every child — don't rebuild for the same ref
      if (ref === hoverRef) return
      const key = cfg.keyOf(ref)
      const entry = key ? cfg.entries.get(key) : undefined
      if (!entry) return
      removeHover()
      hoverEl = create(entry, ref, false)
      hoverRef = ref
    },
    { signal },
  )

  document.addEventListener(
    'click',
    (e) => {
      const ref = findRef(e)
      if (!ref) {
        removeClick()
        return
      }
      e.preventDefault()
      const key = cfg.keyOf(ref)
      const entry = key ? cfg.entries.get(key) : undefined
      if (!entry) return
      removeClick()
      clickEl = create(entry, ref, true)
    },
    { signal },
  )

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        removeHover()
        removeClick()
      }
    },
    { signal },
  )

  signal.addEventListener('abort', () => {
    clearTimeout(hideTimer)
    removeHover()
    removeClick()
  })
}

export function initGlossaryPopups(
  glossary: GlossaryEntry[],
  signal: AbortSignal,
) {
  initPopups(
    {
      entries: new Map(glossary.map((g) => [g.key, g])),
      selector: '[data-gloss-key]',
      keyOf: (ref) => ref.dataset.glossKey,
      className: 'gloss-popup',
      closeClassName: 'gloss-popup-close',
      width: 400,
      render: (entry, closeBtn) =>
        closeBtn
          ? `<div class="gloss-popup-header"><div class="gloss-popup-term">${entry.term}</div>${closeBtn}</div><div>${entry.definition}</div>`
          : `<div class="gloss-popup-term">${entry.term}</div><div>${entry.definition}</div>`,
    },
    signal,
  )
}

const SOURCE_ICONS: Record<string, string> = {
  web: '🌐',
  book: '📖',
  paper: '📄',
  video: '🎬',
  podcast: '🎙️',
  other: '📎',
}

export function initBibliographyPopups(
  bibliography: BibliographyEntry[],
  signal: AbortSignal,
) {
  initPopups(
    {
      entries: new Map(bibliography.map((b) => [b.key, b])),
      selector: '[data-cite-id]',
      keyOf: (ref) => ref.dataset.citeId,
      className: 'bib-popup',
      closeClassName: 'bib-popup-close',
      width: 320,
      render: (entry, closeBtn) => {
        const icon = SOURCE_ICONS[entry.sourceType] ?? SOURCE_ICONS.other
        return `${closeBtn}<div class="bib-popup-source"><span class="bib-popup-icon">${icon}</span>${entry.sourceType.toUpperCase()}</div><div>${entry.text}</div>`
      },
    },
    signal,
  )
}
