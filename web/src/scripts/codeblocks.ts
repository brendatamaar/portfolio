export function initCodeblocks() {
  document.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return
    const btn = document.createElement('button')
    btn.className =
      'copy-btn font-mono text-[10px] uppercase tracking-widest border-2 border-black px-2 py-0.5 bg-white text-black hover:bg-[#FFE600] transition-colors absolute top-2 right-2 shadow-[2px_2px_0px_#000]'
    btn.textContent = 'copy'
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(
        pre.querySelector('code')?.textContent ?? '',
      )
      btn.textContent = 'copied!'
      setTimeout(() => {
        btn.textContent = 'copy'
      }, 2000)
    })
    pre.style.position = 'relative'
    pre.appendChild(btn)
  })
}

export function initImageZoom() {
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
      'fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/90'
    overlay.addEventListener('click', close)

    const img = document.createElement('img')
    img.src = src
    img.alt = 'Zoomed'
    img.className =
      'max-h-[90vh] max-w-[90vw] border-2 border-white object-contain shadow-[8px_8px_0px_#fff]'
    img.addEventListener('click', (e) => e.stopPropagation())

    const closeBtn = document.createElement('button')
    closeBtn.className =
      'absolute top-5 right-6 font-mono text-sm tracking-widest text-white uppercase hover:text-[#FFE600]'
    closeBtn.textContent = '[close]'
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })
}
