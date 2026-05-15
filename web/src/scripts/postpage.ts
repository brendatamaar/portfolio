export function initScrollProgress() {
  const bar = document.getElementById('scroll-progress')
  if (!bar) return
  const update = () => {
    const scrolled = window.scrollY
    const total = document.documentElement.scrollHeight - window.innerHeight
    bar.style.width = total > 0 ? `${(scrolled / total) * 100}%` : '0%'
  }
  window.addEventListener('scroll', update, { passive: true })
  update()
}

export function initBackToTop() {
  const btn = document.getElementById('back-to-top')
  if (!btn) return
  const toggle = () => {
    btn.classList.toggle('opacity-0', window.scrollY < 300)
    btn.classList.toggle('pointer-events-none', window.scrollY < 300)
  }
  window.addEventListener('scroll', toggle, { passive: true })
  toggle()
  btn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' }),
  )
}

export function initShareMenu(title: string) {
  const trigger = document.getElementById('share-trigger')
  const menu = document.getElementById('share-menu')
  const copyBtn = document.getElementById('share-copy')
  if (!trigger || !menu) return

  const close = () => menu.classList.add('hidden')
  trigger.addEventListener('click', () => menu.classList.toggle('hidden'))

  document.addEventListener('mousedown', (e) => {
    if (!trigger.contains(e.target as Node) && !menu.contains(e.target as Node))
      close()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })

  copyBtn?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(window.location.href)
    copyBtn.textContent = 'COPIED!'
    close()
    setTimeout(() => {
      copyBtn.textContent = 'COPY LINK'
    }, 2000)
  })

  const openWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    close()
  }

  document
    .getElementById('share-twitter')
    ?.addEventListener('click', () =>
      openWindow(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`,
      ),
    )
  document
    .getElementById('share-linkedin')
    ?.addEventListener('click', () =>
      openWindow(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      ),
    )
  document
    .getElementById('share-facebook')
    ?.addEventListener('click', () =>
      openWindow(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      ),
    )
}
