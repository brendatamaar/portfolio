// Project screenshot that follows the cursor. Fine pointers only.

export function initPreview() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const pv = document.getElementById('pv')
  const img = document.getElementById('pvImg') as HTMLImageElement | null
  const dataEl = document.getElementById('pv-data')
  if (!pv || !img || !dataEl?.textContent) return
  const data = JSON.parse(dataEl.textContent) as Record<string, string>

  // Fetch every screenshot on the first hover so the card never opens empty.
  let preloaded = false
  const preload = () => {
    if (preloaded) return
    preloaded = true
    for (const src of Object.values(data)) new Image().src = src
  }

  let tx = 0,
    ty = 0,
    x = 0,
    y = 0
  let on = false,
    raf = 0,
    hideT = 0,
    below = false
  const follow = () => {
    x += (tx - x) * 0.2
    y += (ty - y) * 0.2
    pv.style.left = x + 'px'
    pv.style.top = y + 'px'
    raf = on ? requestAnimationFrame(follow) : 0
  }
  // Row hovers put the card to the right of the cursor; text hovers put it BELOW so it never covers the text.
  const place = (e: PointerEvent) => {
    const hw = pv.offsetWidth / 2,
      hh = pv.offsetHeight / 2
    if (below) {
      tx = Math.max(hw, Math.min(innerWidth - hw, e.clientX + 60))
      ty = Math.min(innerHeight - hh, e.clientY + hh + 40)
    } else {
      tx = Math.min(innerWidth - hw, e.clientX + hw + 30)
      ty = Math.max(hh, Math.min(innerHeight - hh, e.clientY))
    }
  }
  const trigger = (t: EventTarget | null) =>
    (t as Element | null)?.closest<HTMLElement>(
      '#projects .row, .intro [data-pv]',
    ) ?? null

  const hosts = [
    document.getElementById('projects'),
    document.querySelector('.intro'),
  ]
  for (const h of hosts) {
    if (!h) continue
    h.addEventListener('pointerover', (ev) => {
      const e = ev as PointerEvent
      const el = trigger(e.target)
      const src = el?.dataset.pv ? data[el.dataset.pv] : undefined
      if (!el || !src) return
      preload()
      clearTimeout(hideT)
      below = el.classList.contains('pvl')
      if (img.getAttribute('src') !== src) img.src = src
      if (!on) {
        place(e)
        x = tx
        y = ty
      }
      on = true
      pv.classList.add('on')
      if (!raf) follow()
    })
    h.addEventListener('pointermove', (e) => place(e as PointerEvent))
    h.addEventListener('pointerout', (ev) => {
      const e = ev as PointerEvent
      const el = trigger(e.target)
      if (el && !el.contains(e.relatedTarget as Node | null))
        hideT = window.setTimeout(() => {
          on = false
          pv.classList.remove('on')
        }, 60)
    })
  }
}
