const NOTE_GAP = 12

export function initSidenotes(signal: AbortSignal) {
  const container = document.querySelector<HTMLElement>('.sidenotes')
  const content = document.querySelector<HTMLElement>('.blog-content')
  if (!container || !content) return

  const pairs = Array.from(
    container.querySelectorAll<HTMLElement>('[data-sidenote]'),
  )
    .map((noteEl) => ({
      noteEl,
      refEl: content.querySelector<HTMLElement>(
        `[data-sidenote-id="${noteEl.dataset.sidenote}"]`,
      ),
    }))
    .filter(
      (p): p is { noteEl: HTMLElement; refEl: HTMLElement } => p.refEl !== null,
    )
  if (!pairs.length) return

  const position = () => {
    // Hidden below lg — nothing to lay out
    if (container.offsetParent === null) return

    // Read everything first, then write, to avoid forced reflow per note
    const containerTop = container.getBoundingClientRect().top
    const measured = pairs.map(({ noteEl, refEl }) => ({
      noteEl,
      top: refEl.getBoundingClientRect().top - containerTop,
      height: noteEl.offsetHeight,
    }))

    // Push notes down so neighbours never overlap
    let minTop = 0
    for (const m of measured) {
      const top = Math.max(m.top, minTop)
      m.noteEl.style.top = `${top}px`
      minTop = top + m.height + NOTE_GAP
    }
  }

  // Re-position when the article reflows (viewport resize, images/fonts loading)
  let rafId = 0
  const schedule = () => {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(position)
  }
  const observer = new ResizeObserver(schedule)
  observer.observe(content)
  signal.addEventListener('abort', () => {
    observer.disconnect()
    cancelAnimationFrame(rafId)
  })

  // Footnote ref click — highlight matching sidenote on desktop
  content.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>(
      'a[data-sidenote-id]',
    )
    if (!link || window.innerWidth < 1024) return
    e.preventDefault()
    const id = link.dataset.sidenoteId
    if (!id) return
    const noteEl = container.querySelector<HTMLElement>(
      `[data-sidenote="${id}"]`,
    )
    if (!noteEl) return
    noteEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    noteEl.classList.remove('sidenote-highlighted')
    void noteEl.offsetWidth
    noteEl.classList.add('sidenote-highlighted')
    noteEl.addEventListener(
      'animationend',
      () => noteEl.classList.remove('sidenote-highlighted'),
      { once: true },
    )
  })
}
