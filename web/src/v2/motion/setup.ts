// Global motion for v2: runs once on the client, before the first page initializes.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ease,
  onPage,
  onScroll,
  prefersReducedMotion,
  scrollToTarget,
  setTransition,
} from '../engine'
import { startHive } from './hive'
import { closeMenu, startMenu } from './menu'

/** Flat-top hexagon of radius r around (x, y), as a clip-path */
function hexagon(x: number, y: number, r: number) {
  const pts = [0, 60, 120, 180, 240, 300].map((a) => {
    const t = (a * Math.PI) / 180
    return `${(x + r * Math.cos(t)).toFixed(1)}px ${(y + r * Math.sin(t)).toFixed(1)}px`
  })
  return `polygon(${pts.join(',')})`
}

export function setupMotion() {
  // Transition: a navy hexagon opens from where you clicked and closes into the middle of the
  // next page, the Sewagi hive shape at full screen. The destination name rides on it.
  let point = { x: innerWidth / 2, y: innerHeight / 2 }
  let title = ''
  document.addEventListener(
    'click',
    (e) => {
      point = {
        x: e.clientX || innerWidth / 2,
        y: e.clientY || innerHeight / 2,
      }
      title =
        (e.target as Element).closest<HTMLElement>('a[data-title]')?.dataset
          .title ?? ''
    },
    true,
  )
  const cover = () => Math.hypot(innerWidth, innerHeight) * 1.2
  setTransition({
    leave: (c) => {
      closeMenu()
      const panel = c.querySelector<HTMLElement>('.curtain__panel')!
      const label = c.querySelector<HTMLElement>('.curtain__label')!
      const name = c.querySelector<HTMLElement>('[data-curtain-title]')!
      name.textContent = title
      title = ''
      const iris = { r: 0 }
      const { x, y } = point
      return gsap
        .timeline()
        .set(c, { autoAlpha: 1 })
        .set(label, { autoAlpha: 0, y: 12 })
        .to(iris, {
          r: cover(),
          duration: 0.85,
          ease: ease.inOut,
          onUpdate: () => void (panel.style.clipPath = hexagon(x, y, iris.r)),
        })
        .to(label, { autoAlpha: 1, y: 0, duration: 0.35, ease: ease.soft }, 0.5)
    },
    enter: (c) => {
      const panel = c.querySelector<HTMLElement>('.curtain__panel')!
      const iris = { r: cover() }
      return gsap
        .timeline()
        .to(c.querySelector('.curtain__label'), {
          autoAlpha: 0,
          y: -12,
          duration: 0.25,
        })
        .to(
          iris,
          {
            r: 0,
            duration: 0.75,
            ease: ease.inOut,
            onUpdate: () =>
              void (panel.style.clipPath = hexagon(
                innerWidth / 2,
                innerHeight / 2,
                iris.r,
              )),
          },
          0.1,
        )
        .set(c, { autoAlpha: 0 })
    },
  })

  // Same-page anchors scroll smoothly through Lenis instead of jumping
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]')
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return
      const url = new URL(a.href, location.href)
      if (url.pathname !== location.pathname || !url.hash) return
      const target = document.querySelector<HTMLElement>(url.hash)
      if (!target) return
      e.preventDefault()
      closeMenu()
      history.pushState(null, '', url.hash)
      scrollToTarget(target)
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    },
    true,
  )

  startHive()
  startMenu()

  // CSS-driven entrances ([data-settle]) start when the page intro plays
  onPage(({ intro }) => {
    intro.add(() => document.documentElement.classList.add('is-entered'), 0)
    return () => document.documentElement.classList.remove('is-entered')
  })

  // Tech stack marquee: drifts on its own, speeds up and reverses with the scroll
  onPage(() => {
    const track = document.querySelector<HTMLElement>(
      '[data-marquee] [data-track]',
    )
    if (!track || prefersReducedMotion()) return
    const loop = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration: 32,
      repeat: -1,
    })
    const hover = track.closest<HTMLElement>('[data-marquee]')!
    let paused = false
    const pause = () => {
      paused = true
      gsap.to(loop, { timeScale: 0, duration: 0.5, overwrite: true })
    }
    const resume = () => {
      paused = false
      gsap.to(loop, { timeScale: 1, duration: 0.5, overwrite: true })
    }
    hover.addEventListener('pointerenter', pause)
    hover.addEventListener('pointerleave', resume)
    const off = onScroll(({ velocity }) => {
      if (paused) return
      const dir = velocity < 0 ? -1 : 1
      gsap.to(loop, {
        timeScale: dir * (1 + Math.min(Math.abs(velocity) / 10, 4)),
        duration: 0.4,
        overwrite: true,
      })
    })
    return () => off()
  })

  // Nav marks the section in view (home); case pages keep their static mark
  onPage(() => {
    const links = [
      ...document.querySelectorAll<HTMLAnchorElement>('[data-spy]'),
    ]
    if (!links.length) return
    document.querySelectorAll<HTMLElement>('[data-section]').forEach((sec) => {
      const link = links.find((l) => l.dataset.spy === sec.id)
      if (!link || link.getAttribute('aria-current') === 'page') return
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (self) =>
          self.isActive
            ? link.setAttribute('aria-current', 'location')
            : link.removeAttribute('aria-current'),
      })
    })
    return () =>
      links.forEach(
        (l) =>
          l.getAttribute('aria-current') === 'location' &&
          l.removeAttribute('aria-current'),
      )
  })
}
