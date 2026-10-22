// Global motion for this site: runs once on the client, before the first page initializes.
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
import { net } from './net'
import { startVisit } from './visit'

export function setupMotion() {
  transition()
  lazyWaterfall()
  startVisit()
  frame()
  stickers()
  writing()
  blogFilter()
  rail()
  requestPath()
  notFound()
  footer()
  lazyPost()
}

// The waterfall table only exists on the homepage: load its driver on demand.
let waterfallStarted = false
function lazyWaterfall() {
  onPage(() => {
    if (waterfallStarted || !document.querySelector('[data-waterfall]')) return
    waterfallStarted = true
    void import('./waterfall').then((m) => m.startWaterfall())
  })
}

// Share/spy/notes/popups/progress only exist on post pages (pages with prose).
let postStarted = false
function lazyPost() {
  onPage(() => {
    if (postStarted || !document.querySelector('.prose')) return
    postStarted = true
    void import('./post').then((m) => m.registerPostFeatures())
  })
}

// Footer: copy the address, go back to the top, and Jakarta's local time (it tells visitors
// whether a reply could come today).
function footer() {
  const jakarta = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
  onPage(() => {
    const off: (() => void)[] = []
    const time = document.querySelector<HTMLTimeElement>('[data-local-time]')
    if (time) {
      const tick = () => {
        time.textContent = `${jakarta.format(new Date())} WIB`
        time.dateTime = new Date().toISOString()
      }
      tick()
      const id = setInterval(tick, 30_000) // text only; nothing animates on it
      off.push(() => clearInterval(id))
    }
    const copy = document.querySelector<HTMLButtonElement>('[data-copy]')
    const status = document.querySelector<HTMLElement>('[data-copy-status]')
    if (copy) {
      const label = copy.querySelector<HTMLElement>('[data-copy-label]')
      let reset: ReturnType<typeof setTimeout> | undefined
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(copy.dataset.copy ?? '')
          if (label) label.textContent = 'Copied'
          if (status) status.textContent = 'Email address copied'
        } catch {
          if (label) label.textContent = 'Press Ctrl+C'
        }
        copy.classList.add('is-done')
        clearTimeout(reset)
        reset = setTimeout(() => {
          if (label) label.textContent = 'Copy address'
          if (status) status.textContent = ''
          copy.classList.remove('is-done')
        }, 2000)
      }
      copy.addEventListener('click', onCopy)
      off.push(() => {
        copy.removeEventListener('click', onCopy)
        clearTimeout(reset)
      })
    }
    const top = document.querySelector<HTMLButtonElement>('[data-top]')
    if (top) {
      const onTop = () => {
        scrollToTarget(0)
        document.getElementById('main')?.focus({ preventScroll: true })
      }
      top.addEventListener('click', onTop)
      off.push(() => top.removeEventListener('click', onTop))
    }
    return () => off.forEach((f) => f())
  })
}

// Navigation is four requests: colored bands stream in from the left one after another, like rows
// of a waterfall, while the next page is fetched; then the real status and time, and they stream
// off to the right.
function transition() {
  let crawl: gsap.core.Tween | null = null
  const parts = (c: HTMLElement) => ({
    bands: c.querySelectorAll<HTMLElement>('.curtain__band'),
    req: c.querySelector<HTMLElement>('.curtain__req')!,
    path: c.querySelector<HTMLElement>('[data-req-path]')!,
    status: c.querySelector<HTMLElement>('[data-req-status]')!,
    bar: c.querySelector<HTMLElement>('.curtain__bar > span')!,
  })
  setTransition({
    leave: (c) => {
      const { bands, req, path, status, bar } = parts(c)
      path.textContent = net.to
      status.textContent = 'pending'
      gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' })
      crawl = gsap.to(bar, {
        scaleX: 0.85,
        duration: 2,
        ease: 'power2.out',
        delay: 0.45,
      }) // honest: it waits for the fetch
      document.documentElement.classList.add('is-navigating')
      return gsap
        .timeline()
        .set(c, { autoAlpha: 1 })
        .set(req, { autoAlpha: 0 })
        .fromTo(
          bands,
          { scaleX: 0, transformOrigin: '0% 50%' },
          { scaleX: 1, duration: 0.6, ease: ease.inOut, stagger: 0.07 },
          0,
        )
        .to(req, { autoAlpha: 1, duration: 0.25 }, 0.55)
    },
    enter: (c) => {
      const { bands, req, status, bar } = parts(c)
      crawl?.kill()
      status.textContent = `${statusOf(net.to)}  ${Math.max(1, Math.round(net.ms))} ms`
      return gsap
        .timeline()
        .to(bar, { scaleX: 1, duration: 0.25, ease: ease.soft })
        .to(req, { autoAlpha: 0, duration: 0.2 }, '+=0.15')
        .to(
          bands,
          {
            scaleX: 0,
            transformOrigin: '100% 50%',
            duration: 0.6,
            ease: ease.inOut,
            stagger: 0.07,
          },
          '<',
        )
        .add(() => document.documentElement.classList.remove('is-navigating'))
        .set(c, { autoAlpha: 0 })
    },
  })
}

// Stickers pop on like they were slapped onto the page.
function stickers() {
  onPage(({ intro }) => {
    if (prefersReducedMotion()) return
    const pops = gsap.utils.toArray<HTMLElement>('[data-sticker], [data-pop]')
    pops.forEach((el) => {
      const inHero = !!el.closest('.hero, .nf')
      // scale only: each sticker keeps its own CSS tilt
      const from = { scale: 0, opacity: 0 }
      const to = { scale: 1, opacity: 1, duration: 0.7, ease: ease.spring }
      if (inHero)
        intro.add(gsap.fromTo(el, from, to), 0.25 + Math.random() * 0.35)
      else
        gsap.fromTo(el, from, {
          ...to,
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        })
    })
  })
}

// Writing scrapboard: "Read more" reveals the posts past the first four, in place.
function writing() {
  onPage(() => {
    const button =
      document.querySelector<HTMLButtonElement>('[data-scrap-more]')
    if (!button) return
    const extras = Array.from(
      document.querySelectorAll<HTMLElement>('[data-scrap-extra]'),
    )
    if (!extras.length) return
    const onMore = () => {
      button.setAttribute('aria-expanded', 'true')
      extras.forEach((el, i) => {
        el.hidden = false
        if (!prefersReducedMotion())
          gsap.fromTo(
            el,
            { scale: 0.96, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              delay: i * 0.06,
              ease: ease.out,
            },
          )
      })
      button.hidden = true
    }
    button.addEventListener('click', onMore)
    return () => button.removeEventListener('click', onMore)
  })
}

// Blog index: tag filter toggles post cards by their data-tags, in place.
function blogFilter() {
  onPage(() => {
    const bar = document.querySelector<HTMLElement>('[data-blog-filter]')
    if (!bar) return
    const items = Array.from(
      document.querySelectorAll<HTMLElement>('[data-post-item]'),
    )
    const buttons = Array.from(
      bar.querySelectorAll<HTMLButtonElement>('[data-tag]'),
    )
    let active = ''
    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        '[data-tag]',
      )
      if (!btn) return
      const tag = btn.dataset.tag ?? ''
      active = tag === active ? '' : tag
      items.forEach((item) => {
        const show =
          !active || (item.dataset.tags ?? '').split(',').includes(active)
        item.hidden = !show
      })
      buttons.forEach((b) =>
        b.setAttribute(
          'aria-pressed',
          String((b.dataset.tag ?? '') === active),
        ),
      )
    }
    bar.addEventListener('click', onClick)
    return () => bar.removeEventListener('click', onClick)
  })
}

// Post page: share menu (copy link + social windows), mirroring the live blog.
// Post page: TOC scrollspy + smooth anchor scrolling.
// Post page: sidenotes sit beside the paragraph that references them.
// Post page: code copy buttons, image zoom, and glossary/bibliography jump-to-reference.
// Projects rail: native horizontal scroll with snap; the buttons move it one card at a time.
function rail() {
  onPage(() => {
    const list = document.querySelector<HTMLElement>('[data-rail]')
    if (!list) return
    const prev = document.querySelector<HTMLButtonElement>('[data-rail-prev]')
    const next = document.querySelector<HTMLButtonElement>('[data-rail-next]')
    const step = () =>
      (list.firstElementChild as HTMLElement | null)?.getBoundingClientRect()
        .width ?? list.clientWidth
    const sync = () => {
      if (prev) prev.disabled = list.scrollLeft < 4
      if (next)
        next.disabled =
          list.scrollLeft + list.clientWidth > list.scrollWidth - 4
    }
    const go = (dir: number) =>
      list.scrollBy({
        left: dir * (step() + 24),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    const onPrev = () => go(-1)
    const onNext = () => go(1)
    prev?.addEventListener('click', onPrev)
    next?.addEventListener('click', onNext)
    list.addEventListener('scroll', sync, { passive: true }) // the rail's own scroll, not the page's
    sync()
    return () => {
      prev?.removeEventListener('click', onPrev)
      next?.removeEventListener('click', onNext)
      list.removeEventListener('scroll', sync)
    }
  })
}

// The real status of the page fetch, from Resource Timing (Chromium, Firefox); the swapped-in page
// tells us when the browser does not report it.
function statusOf(path: string) {
  const url = new URL(path, location.href).href
  const hit = (
    performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  )
    .filter((e) => e.name === url)
    .pop()
  const code = (
    hit as (PerformanceResourceTiming & { responseStatus?: number }) | undefined
  )?.responseStatus
  if (code === 404 || (!code && document.querySelector('[data-notfound]')))
    return '404 Not Found'
  return code && code !== 200 ? String(code) : '200 OK'
}

// Corner frame: steps aside while reading down, returns (on a solid ground) on the way up.
function frame() {
  let last = 0
  const h = document.documentElement.classList
  onScroll(({ y }) => {
    h.toggle('frame-solid', y > 24)
    if (Math.abs(y - last) < 4) return
    h.toggle('frame-away', y > 200 && y > last)
    last = y
  })
  document.addEventListener('astro:after-swap', () =>
    h.remove('frame-away', 'frame-solid'),
  )
}

// Posts: reading progress streams along the header like a download.
// Case pages: each stage of the request path streams its bar as it scrolls in, in order.
function requestPath() {
  onPage(() => {
    const path = document.querySelector<HTMLElement>('[data-path]')
    if (!path || prefersReducedMotion()) return
    path.querySelectorAll<HTMLElement>('.path__stage').forEach((stage) => {
      const bar = stage.querySelector('.path__bar')
      const text = stage.querySelectorAll('.path__n, .path__name, .path__text')
      gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' })
      gsap.set(text, { opacity: 0, x: -12 })
      ScrollTrigger.create({
        trigger: stage,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(bar, { scaleX: 1, duration: 1, ease: ease.out })
          gsap.to(text, {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: ease.out,
            stagger: 0.05,
            delay: 0.1,
          })
        },
      })
    })
  })
}

// 404: fill in the path and the real time it took to learn there was nothing here.
function notFound() {
  onPage(({ intro }) => {
    const t = document.querySelector<HTMLElement>('[data-notfound]')
    if (!t) return
    const path = t.querySelector<HTMLElement>('[data-nf-path]')
    const time = t.querySelector<HTMLElement>('[data-nf-time]')
    const bar = t.querySelector<HTMLElement>('[data-nf-bar]')
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    const ms = net.navigated ? net.ms : (nav?.responseEnd ?? 0)
    if (path) path.textContent = location.pathname
    if (time && ms) time.textContent = `${Math.max(1, Math.round(ms))} ms`
    if (bar && !prefersReducedMotion())
      intro.add(
        gsap.from(bar, {
          scaleX: 0,
          transformOrigin: '0% 50%',
          duration: 1,
          ease: ease.out,
        }),
        0.1,
      )
  })
}
