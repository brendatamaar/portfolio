// First-load sequence. Progress follows REAL work (fonts + critical images), eased by GSAP,
// with a floor so it reads as intentional and a ceiling so it never becomes a usability problem.
// Markup (#loader) lives in the home hero; it is the source label counting up to 220 V.
import { gsap } from 'gsap'
import { prefersReducedMotion } from './env'

let format = (p: number) => String(Math.round(p)).padStart(3, '0')
/** Customize the counter text. p goes 0 → 100. */
export const setLoaderFormat = (fn: (p: number) => string) => {
  format = fn
}
let exit: ((root: HTMLElement) => gsap.core.Timeline) | null = null
/** Replace the exit choreography (the loader → hero handoff). Return a timeline. */
export const setLoaderExit = (
  fn: (root: HTMLElement) => gsap.core.Timeline,
) => {
  exit = fn
}

// Both measured from navigation start, so a slow boot on a weak phone eats into the budget
const MIN = 1.0 // seconds: long enough to read as a designed moment
const MAX = 1.7 // seconds: a longer loader is a usability problem

function criticalAssets(): Promise<unknown>[] {
  const imgs = [
    ...document.querySelectorAll<HTMLImageElement>(
      'img[data-critical], [data-intro] img',
    ),
  ]
  return [
    document.fonts.ready,
    ...imgs.map((i) =>
      i.complete ? Promise.resolve() : i.decode().catch(() => {}),
    ),
  ]
}

export async function runLoader(): Promise<void> {
  const root = document.getElementById('loader')
  if (!root) return finish(null)
  if (prefersReducedMotion()) {
    await Promise.race([Promise.all(criticalAssets()), wait(MAX)])
    return finish(root)
  }
  const count = root.querySelector<HTMLElement>('[data-loader-count]')
  // Booted after the budget already ran out (slow phone): show the end reading, no count
  if (performance.now() / 1000 > MAX) {
    if (count) count.textContent = format(100)
    return finish(root)
  }
  const tasks = criticalAssets()
  let done = 0
  const shown = { v: 0 }
  const target = { v: 0 }
  tasks.forEach((t) =>
    t.then(() => {
      done++
      target.v = (done / tasks.length) * 100
    }),
  )
  const start = performance.now()
  const floor = Math.max(0.35, MIN - start / 1000) // the count itself always gets a moment

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000
      const sinceNav = performance.now() / 1000
      const timeCap = Math.min(100, (elapsed / floor) * 100) // never faster than the floor
      const goal = sinceNav > MAX ? 100 : Math.min(target.v, timeCap)
      shown.v += (goal - shown.v) * (goal === 100 ? 0.3 : 0.12)
      // Slow devices: never let easing stretch the count past the cap
      if ((goal === 100 && shown.v > 99.5) || sinceNav > MAX + 0.3)
        shown.v = 100
      if (count) count.textContent = format(shown.v)
      if (shown.v === 100) {
        gsap.ticker.remove(tick)
        resolve()
      }
    }
    gsap.ticker.add(tick)
  })

  if (exit) await exit(root)
  finish(root)
}

function finish(root: HTMLElement | null) {
  if (root) root.hidden = true
  document.documentElement.classList.add('is-loaded')
}

const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000))
