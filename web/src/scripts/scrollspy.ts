export function initScrollspy() {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'),
  )
  if (!links.length) return

  const headingEls = links
    .map((l) => document.getElementById(l.dataset.tocLink!))
    .filter(Boolean) as HTMLElement[]

  const visibleIds = new Set<string>()

  const setActive = (id: string) => {
    links.forEach((link) => {
      const active = link.dataset.tocLink === id
      link.classList.toggle('font-bold', active)
      link.classList.toggle('text-black', active)
      link.classList.toggle('dark:text-white', active)
      link.classList.toggle('text-black/40', !active)
      link.classList.toggle('dark:text-white/40', !active)
    })
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) visibleIds.add(e.target.id)
        else visibleIds.delete(e.target.id)
      })
      const topmost = headingEls.find((el) => visibleIds.has(el.id))
      if (topmost) setActive(topmost.id)
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
  )

  headingEls.forEach((el) => observer.observe(el))

  // Smooth scroll on TOC link click
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const id = link.dataset.tocLink!
      const el = document.getElementById(id)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
      history.pushState(null, '', `#${id}`)
    })
  })
}
