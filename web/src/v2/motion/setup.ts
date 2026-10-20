// Global motion for v2: runs once on the client, before the first page initializes.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ease,
  onPage,
  onScroll,
  prefersReducedMotion,
  scrollToTarget,
  setLoaderFormat,
  setTransition,
} from '../engine'
import { setPower, startGrid } from './grid'
import { closeMenu, startMenu } from './menu'

const INK = '#111312'

export function setupMotion() {
  // Loader: the source label counts up to mains voltage while the line fills
  setLoaderFormat((p) => {
    setPower(p / 100)
    return String(Math.round(p * 2.2)).padStart(3, '0')
  })

  // Transition: throw the switch. A live wire draws across the middle, the cable panel opens
  // from it, and on the new page closes back onto the wire before the wire retracts.
  let title = ''
  document.addEventListener(
    'click',
    (e) => {
      title =
        (e.target as Element).closest<HTMLElement>('a[data-title]')?.dataset
          .title ?? ''
    },
    true,
  )
  setTransition({
    leave: (c) => {
      closeMenu()
      const label = c.querySelector<HTMLElement>('.curtain__label')!
      label.textContent = title
      title = ''
      return gsap
        .timeline()
        .set(c, { autoAlpha: 1 })
        .set(c.querySelector('.curtain__panel'), {
          scaleY: 0,
          transformOrigin: '50% 50%',
        })
        .set(label, { autoAlpha: 0 })
        .fromTo(
          c.querySelector('.curtain__wire'),
          { scaleX: 0, transformOrigin: '0% 50%' },
          { scaleX: 1, duration: 0.45, ease: ease.inOut },
        )
        .to(
          c.querySelector('.curtain__panel'),
          { scaleY: 1, duration: 0.6, ease: ease.inOut },
          0.25,
        )
        .to(label, { autoAlpha: 1, duration: 0.25 }, 0.5)
    },
    enter: (c) =>
      gsap
        .timeline()
        .to(c.querySelector('.curtain__label'), {
          autoAlpha: 0,
          duration: 0.15,
        })
        .to(c.querySelector('.curtain__panel'), {
          scaleY: 0,
          duration: 0.65,
          ease: ease.inOut,
        })
        .to(
          c.querySelector('.curtain__wire'),
          {
            scaleX: 0,
            transformOrigin: '100% 50%',
            duration: 0.4,
            ease: ease.inOut,
          },
          '-=0.3',
        )
        .set(c, { autoAlpha: 0 }),
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

  // The frame steps aside while reading down and comes back on the way up
  let last = 0
  onScroll(({ y }) => {
    document.documentElement.classList.toggle('scrolled', y > 40)
    if (Math.abs(y - last) < 4) return
    document.documentElement.classList.toggle('frame-away', y > 160 && y > last)
    last = y
  })

  // A page can open mid-way (back/forward, #hash links): set the frame band from where it lands
  onPage(() => {
    requestAnimationFrame(() =>
      document.documentElement.classList.toggle('scrolled', scrollY > 40),
    )
  })

  startGrid()
  startMenu()

  // Energize: display lines stretch from condensed to expanded as the page powers up
  onPage(({ intro }) => {
    const els = document.querySelectorAll<HTMLElement>('[data-energize]')
    if (!els.length || prefersReducedMotion()) return
    const wmax =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--wmax'),
      ) || 125
    intro.add(
      gsap.to(els, {
        '--wdth': wmax,
        color: INK,
        duration: 1.25,
        stagger: 0.12,
        ease: ease.out,
      }),
      0,
    )
  })

  // Nav marks the section in view
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
