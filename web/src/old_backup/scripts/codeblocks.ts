export function initCodeblocks() {
  document
    .querySelectorAll<HTMLPreElement>('.blog-content pre')
    .forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return
      const btn = document.createElement('button')
      btn.className =
        'copy-btn absolute top-2.5 right-2.5 h-7 rounded-3xl border border-white/20 bg-white/5 px-3 text-[11px] font-bold tracking-[0.1em] text-white/80 uppercase transition-colors hover:border-teal hover:bg-teal hover:text-white'
      btn.textContent = 'copy'
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(
            pre.querySelector('code')?.textContent ?? '',
          )
        } catch {
          return
        }
        btn.textContent = 'copied!'
        setTimeout(() => {
          btn.textContent = 'copy'
        }, 2000)
      })
      pre.style.position = 'relative'
      pre.appendChild(btn)
    })
}

export function initImageZoom(signal: AbortSignal) {
  let overlay: HTMLDivElement | null = null

  const close = () => {
    overlay?.remove()
    overlay = null
  }

  const open = (src: string) => {
    close()
    overlay = document.createElement('div')
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.className =
      'fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-navy/90 backdrop-blur-sm'
    overlay.addEventListener('click', close)

    const img = document.createElement('img')
    img.src = src
    img.alt = 'Zoomed'
    img.className =
      'max-h-[90vh] max-w-[90vw] rounded-xs object-contain shadow-raised'
    img.addEventListener('click', (e) => e.stopPropagation())

    const closeBtn = document.createElement('button')
    closeBtn.className =
      'absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl leading-none text-navy hover:bg-teal hover:text-white'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', close)

    overlay.appendChild(img)
    overlay.appendChild(closeBtn)
    document.body.appendChild(overlay)
  }

  document
    .querySelectorAll<HTMLImageElement>('figure img, .blog-content p img')
    .forEach((img) => {
      img.style.cursor = 'zoom-in'
      img.addEventListener('click', () => open(img.src))
    })

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') close()
    },
    { signal },
  )
  signal.addEventListener('abort', close)
}
