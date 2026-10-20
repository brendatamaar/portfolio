// The concept's driver: one variable (the current front, a document y position) decides how much
// of every bus is live, which nodes are energized, and what the meter reads. The front follows
// scroll; during the first load it is scaled by the loader's power (000 → 220 V).
// Idle input: a pulse keeps running down the visible live part of the line.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onPage, onScroll, prefersReducedMotion } from '../engine'

let power = 1
let applyNow: (() => void) | null = null

/** 0..1 while the loader counts; the line fills from the source as it rises. */
export function setPower(p: number) {
  power = p
  applyNow?.()
}

type Bus = {
  live: HTMLElement | null
  pulse: HTMLElement | null
  spark: HTMLElement | null
  offset: number
  top: number
  h: number
  fill: number
}

const PULSE_SPEED = 460 // px per second
const PULSE_LEN = 144 // keep in sync with .bus__pulse height (9rem)

export function startGrid() {
  onPage(() => {
    const busEls = [...document.querySelectorAll<HTMLElement>('.bus')]
    const nodes = [...document.querySelectorAll<HTMLElement>('[data-node]')]
    if (!busEls.length && !nodes.length) return
    const reduced = prefersReducedMotion()
    const meter = document.querySelector<HTMLElement>('[data-meter="live"]')
    if (
      reduced ||
      document.documentElement.classList.contains('is-loaded') ||
      !document.getElementById('loader')
    )
      power = 1
    else power = 0

    let buses: Bus[] = []
    let ys: number[] = []
    let docH = 0
    let front = 0
    let lit = -1

    const measure = () => {
      const sy = scrollY
      buses = busEls.map((el) => {
        const r = el.getBoundingClientRect()
        return {
          live: el.querySelector('.bus__live'),
          pulse: el.querySelector('.bus__pulse'),
          spark:
            el.parentElement?.querySelector<HTMLElement>(
              ':scope > .bus__spark',
            ) ?? null,
          offset: el.offsetTop,
          top: r.top + sy,
          h: r.height,
          fill: 0,
        }
      })
      ys = nodes.map((n) => {
        const r = (n.querySelector('.node__dot') ?? n).getBoundingClientRect()
        return r.top + Math.min(r.height / 2, 40) + sy
      })
      docH = document.documentElement.scrollHeight
    }

    const apply = () => {
      const y = scrollY
      const max = Math.max(1, docH - innerHeight)
      // The front sits below mid-screen and reaches the very end of the page on the last scroll
      const prog = Math.min(1, y / max)
      front = reduced ? Infinity : y + innerHeight * (0.62 + 0.38 * prog ** 3)
      for (const b of buses) {
        b.fill = b.h
          ? Math.min(1, Math.max(0, (front - b.top) / b.h)) * power
          : 0
        if (b.live) b.live.style.transform = `scaleY(${b.fill})`
      }
      let count = 0
      nodes.forEach((n, i) => {
        const on = power >= 1 && ys[i] <= front
        n.classList.toggle('is-live', on)
        if (on && n.dataset.node === 'project') count++
      })
      if (meter && count !== lit) {
        lit = count
        meter.textContent = String(count).padStart(2, '0')
      }
    }

    const refresh = () => {
      measure()
      apply()
    }
    refresh()
    applyNow = apply
    const offScroll = onScroll(apply)
    ScrollTrigger.addEventListener('refresh', refresh)
    const ro = new ResizeObserver(refresh)
    ro.observe(document.body)
    document.fonts.ready.then(refresh)

    // Idle: current keeps flowing down the visible part of each live bus
    const tick = (t: number) => {
      const top = scrollY
      for (const b of buses) {
        if (!b.pulse) continue
        const start = Math.max(0, top - b.top)
        const end = b.fill * b.h
        const span = end - start
        const show = span >= PULSE_LEN ? 'visible' : 'hidden'
        b.pulse.style.visibility = show
        if (b.spark) b.spark.style.visibility = show
        if (show === 'hidden') continue
        const head = start + ((t * PULSE_SPEED) % span)
        b.pulse.style.transform = `translateY(${head - PULSE_LEN}px)`
        if (b.spark)
          b.spark.style.transform = `translateY(${b.offset + head - 4}px)`
      }
    }
    if (!reduced) gsap.ticker.add(tick)

    return () => {
      applyNow = null
      offScroll()
      ScrollTrigger.removeEventListener('refresh', refresh)
      ro.disconnect()
      gsap.ticker.remove(tick)
    }
  })
}
