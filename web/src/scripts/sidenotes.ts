export function initSidenotes() {
  const container = document.querySelector<HTMLElement>('.sidenotes')
  const content = document.querySelector<HTMLElement>('.blog-content')
  if (!container || !content) return

  const position = () => {
    const pairs = Array.from(
      container.querySelectorAll<HTMLElement>('[data-sidenote]'),
    )
      .map((noteEl) => {
        const id = noteEl.dataset.sidenote
        const refEl = content.querySelector<HTMLElement>(
          `[data-sidenote-id="${id}"]`,
        )
        return { noteEl, refEl }
      })
      .filter(
        (p): p is { noteEl: HTMLElement; refEl: HTMLElement } =>
          p.refEl !== null,
      )

    const containerTop = container.getBoundingClientRect().top + window.scrollY
    pairs.forEach(({ noteEl, refEl }) => {
      noteEl.style.top = `${refEl.getBoundingClientRect().top + window.scrollY - containerTop}px`
    })
  }

  position()

  let rafId = 0
  const onResize = () => {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(position)
  }
  window.addEventListener('resize', onResize)

  // Footnote ref click — highlight matching sidenote on desktop
  content.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest(
      'a[data-sidenote-id]',
    ) as HTMLAnchorElement | null
    if (!link || window.innerWidth < 1024) return
    e.preventDefault()
    const id = link.dataset.sidenoteId
    if (!id) return
    const noteEl = document.querySelector<HTMLElement>(
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
