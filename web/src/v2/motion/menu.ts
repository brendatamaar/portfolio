// Phone menu: a cable-black sheet. Focus is trapped inside, Escape closes, focus returns.
import { gsap } from 'gsap'
import {
  ease,
  onPage,
  prefersReducedMotion,
  startScroll,
  stopScroll,
} from '../engine'

let close: ((restore?: boolean) => void) | null = null
/** Close the menu if it is open (used when a navigation starts). */
export const closeMenu = (restore = false) => close?.(restore)

export function startMenu() {
  onPage(() => {
    const menu = document.getElementById('menu')
    const openBtn =
      document.querySelector<HTMLButtonElement>('[data-menu-open]')
    const closeBtn = menu?.querySelector<HTMLButtonElement>('[data-menu-close]')
    if (!menu || !openBtn || !closeBtn) return
    const links = [
      ...menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]'),
    ]
    const focusables = () => [closeBtn, ...links]

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return void doClose(true)
      if (e.key !== 'Tab') return
      const f = focusables()
      const i = f.indexOf(document.activeElement as HTMLAnchorElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        f[f.length - 1].focus()
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault()
        f[0].focus()
      }
    }

    const open = () => {
      menu.hidden = false
      openBtn.setAttribute('aria-expanded', 'true')
      stopScroll()
      document.addEventListener('keydown', onKey)
      if (!prefersReducedMotion()) {
        gsap.fromTo(
          menu,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: ease.inOut },
        )
        gsap.fromTo(
          links,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.9,
            stagger: 0.05,
            ease: ease.out,
            delay: 0.25,
          },
        )
      }
      links[0]?.focus()
    }
    const doClose = (restore = true) => {
      if (menu.hidden) return
      menu.hidden = true
      openBtn.setAttribute('aria-expanded', 'false')
      document.removeEventListener('keydown', onKey)
      startScroll()
      if (restore) openBtn.focus()
    }
    close = doClose
    const onLink = () => doClose(false)

    openBtn.addEventListener('click', open)
    closeBtn.addEventListener('click', () => doClose(true))
    links.forEach((l) => l.addEventListener('click', onLink))
    return () => {
      document.removeEventListener('keydown', onKey)
      close = null
    }
  })
}
