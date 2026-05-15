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

function applyStyle(el: HTMLElement, style: Partial<CSSStyleDeclaration>) {
  Object.assign(el.style, style)
}

export function initGlossaryPopups(glossary: GlossaryEntry[]) {
  const map = new Map(glossary.map((g) => [g.key, g]))
  let hoverEl: HTMLDivElement | null = null
  let clickEl: HTMLDivElement | null = null
  let hideTimer = 0

  const removeHover = () => {
    hoverEl?.remove()
    hoverEl = null
  }
  const removeClick = () => {
    clickEl?.remove()
    clickEl = null
  }

  const showHover = (entry: GlossaryEntry, ref: HTMLElement) => {
    removeHover()
    const rect = ref.getBoundingClientRect()
    hoverEl = document.createElement('div')
    hoverEl.className = 'gloss-popup'
    hoverEl.style.pointerEvents = 'none'
    hoverEl.innerHTML = `<div class="gloss-popup-term">${entry.term}</div><div>${entry.definition}</div>`
    applyStyle(
      hoverEl,
      computePopupStyle(rect.left + rect.width / 2, rect.top, rect.bottom, {
        width: 400,
        margin: 8,
      }),
    )
    document.body.appendChild(hoverEl)
  }

  const showClick = (entry: GlossaryEntry, ref: HTMLElement) => {
    removeClick()
    const rect = ref.getBoundingClientRect()
    clickEl = document.createElement('div')
    clickEl.className = 'gloss-popup'
    clickEl.innerHTML = `
      <div class="gloss-popup-header">
        <div class="gloss-popup-term">${entry.term}</div>
        <button class="gloss-popup-close" aria-label="Close">×</button>
      </div>
      <div>${entry.definition}</div>`
    applyStyle(
      clickEl,
      computePopupStyle(rect.left + rect.width / 2, rect.top, rect.bottom, {
        width: 400,
        margin: 8,
      }),
    )
    clickEl
      .querySelector('.gloss-popup-close')
      ?.addEventListener('click', removeClick)
    document.body.appendChild(clickEl)
  }

  document.addEventListener('mouseover', (e) => {
    const ref = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-gloss-key]',
    )
    if (!ref) {
      clearTimeout(hideTimer)
      hideTimer = window.setTimeout(removeHover, 150)
      return
    }
    clearTimeout(hideTimer)
    const entry = map.get(ref.dataset.glossKey!)
    if (entry) showHover(entry, ref)
  })

  document.addEventListener('click', (e) => {
    const ref = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-gloss-key]',
    )
    if (!ref) {
      removeClick()
      return
    }
    e.preventDefault()
    const entry = map.get(ref.dataset.glossKey!)
    if (entry) showClick(entry, ref)
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeHover()
      removeClick()
    }
  })
}

export function initBibliographyPopups(bibliography: BibliographyEntry[]) {
  const map = new Map(bibliography.map((b) => [b.key, b]))
  let hoverEl: HTMLDivElement | null = null
  let clickEl: HTMLDivElement | null = null
  let hideTimer = 0

  const SOURCE_ICONS: Record<string, string> = {
    web: '🌐',
    book: '📖',
    paper: '📄',
    video: '🎬',
    podcast: '🎙️',
    other: '📎',
  }

  const removeHover = () => {
    hoverEl?.remove()
    hoverEl = null
  }
  const removeClick = () => {
    clickEl?.remove()
    clickEl = null
  }

  const buildContent = (entry: BibliographyEntry) => {
    const icon = SOURCE_ICONS[entry.sourceType] ?? SOURCE_ICONS.other
    return `
      <div class="bib-popup-source">
        <span class="bib-popup-icon">${icon}</span>
        ${entry.sourceType.toUpperCase()}
      </div>
      <div>${entry.text}</div>`
  }

  const showHover = (entry: BibliographyEntry, ref: HTMLElement) => {
    removeHover()
    const rect = ref.getBoundingClientRect()
    hoverEl = document.createElement('div')
    hoverEl.className = 'bib-popup'
    hoverEl.style.pointerEvents = 'none'
    hoverEl.innerHTML = buildContent(entry)
    applyStyle(
      hoverEl,
      computePopupStyle(rect.left + rect.width / 2, rect.top, rect.bottom, {
        width: 320,
        margin: 8,
      }),
    )
    document.body.appendChild(hoverEl)
  }

  const showClick = (entry: BibliographyEntry, ref: HTMLElement) => {
    removeClick()
    const rect = ref.getBoundingClientRect()
    clickEl = document.createElement('div')
    clickEl.className = 'bib-popup'
    clickEl.innerHTML = `<button class="bib-popup-close" aria-label="Close">×</button>${buildContent(entry)}`
    applyStyle(
      clickEl,
      computePopupStyle(rect.left + rect.width / 2, rect.top, rect.bottom, {
        width: 320,
        margin: 8,
      }),
    )
    clickEl
      .querySelector('.bib-popup-close')
      ?.addEventListener('click', removeClick)
    document.body.appendChild(clickEl)
  }

  document.addEventListener('mouseover', (e) => {
    const ref = (e.target as HTMLElement).closest<HTMLElement>('[data-cite-id]')
    if (!ref) {
      clearTimeout(hideTimer)
      hideTimer = window.setTimeout(removeHover, 150)
      return
    }
    clearTimeout(hideTimer)
    const entry = map.get(ref.dataset.citeId!)
    if (entry) showHover(entry, ref)
  })

  document.addEventListener('click', (e) => {
    const ref = (e.target as HTMLElement).closest<HTMLElement>('[data-cite-id]')
    if (!ref) {
      removeClick()
      return
    }
    e.preventDefault()
    const entry = map.get(ref.dataset.citeId!)
    if (entry) showClick(entry, ref)
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeHover()
      removeClick()
    }
  })
}
