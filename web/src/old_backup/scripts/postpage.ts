export function initScrollProgress(signal: AbortSignal) {
  const bar = document.getElementById('scroll-progress')
  if (!bar) return

  // Scales a full-width bar (transform, not width) so scrolling never triggers layout
  let ticking = false
  const update = () => {
    ticking = false
    const total = document.documentElement.scrollHeight - window.innerHeight
    const ratio = total > 0 ? Math.min(1, window.scrollY / total) : 0
    bar.style.transform = `scaleX(${ratio})`
  }
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }
  window.addEventListener('scroll', onScroll, { passive: true, signal })
  window.addEventListener('resize', onScroll, { passive: true, signal })
  update()
}

export function initBackToTop(signal: AbortSignal) {
  const btn = document.getElementById('back-to-top')
  if (!btn) return

  let visible: boolean | null = null
  const toggle = () => {
    const next = window.scrollY >= 300
    if (next === visible) return
    visible = next
    btn.classList.toggle('opacity-0', !next)
    btn.classList.toggle('pointer-events-none', !next)
    btn.tabIndex = next ? 0 : -1
  }
  window.addEventListener('scroll', toggle, { passive: true, signal })
  toggle()
  btn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' }),
  )
}

export function initShareMenu(signal: AbortSignal) {
  const trigger = document.getElementById('share-trigger')
  const menu = document.getElementById('share-menu')
  const copyBtn = document.getElementById('share-copy')
  if (!trigger || !menu) return

  const title = trigger.dataset.title ?? document.title
  const setOpen = (open: boolean) => {
    menu.classList.toggle('hidden', !open)
    trigger.setAttribute('aria-expanded', String(open))
  }
  const close = () => setOpen(false)

  trigger.addEventListener('click', () =>
    setOpen(menu.classList.contains('hidden')),
  )

  document.addEventListener(
    'mousedown',
    (e) => {
      const target = e.target as Node
      if (!trigger.contains(target) && !menu.contains(target)) close()
    },
    { signal },
  )
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') close()
    },
    { signal },
  )

  copyBtn?.addEventListener('click', async () => {
    const label = copyBtn.dataset.label ?? copyBtn.textContent
    try {
      await navigator.clipboard.writeText(window.location.href)
      copyBtn.textContent = copyBtn.dataset.copied ?? label
    } catch {
      return
    }
    close()
    setTimeout(() => {
      copyBtn.textContent = label
    }, 2000)
  })

  const openWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    close()
  }
  const href = () => encodeURIComponent(window.location.href)

  document
    .getElementById('share-twitter')
    ?.addEventListener('click', () =>
      openWindow(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${href()}`,
      ),
    )
  document
    .getElementById('share-linkedin')
    ?.addEventListener('click', () =>
      openWindow(
        `https://www.linkedin.com/sharing/share-offsite/?url=${href()}`,
      ),
    )
  document
    .getElementById('share-facebook')
    ?.addEventListener('click', () =>
      openWindow(`https://www.facebook.com/sharer/sharer.php?u=${href()}`),
    )
}
