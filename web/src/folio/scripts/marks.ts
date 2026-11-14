// Redraw a pen mark when the pointer enters it. Hosts: any element holding .mk spans.
export function initMarks(host: Element | null) {
  host?.addEventListener('pointerover', (e) => {
    const ev = e as PointerEvent
    const m = (ev.target as Element).closest<HTMLElement>('.mk')
    if (!m || m.contains(ev.relatedTarget as Node | null)) return
    m.classList.remove('draw')
    void m.offsetWidth
    m.classList.add('draw', 'again')
  })
}
