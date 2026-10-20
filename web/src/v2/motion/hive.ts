// The honeycomb is the one thing that lives at rest: cells pop into place (soft overshoot, the
// site's motion verb), then drift on a slow sine and lean toward the pointer by their depth.
// Off screen they stop; under reduced motion they never move.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isTouch, onPage, onScroll, prefersReducedMotion } from '../engine'

const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

export function startHive() {
  if (prefersReducedMotion()) return
  if (isTouch()) {
    // Touch: scroll velocity stands in for the pointer
    onScroll(({ velocity }) => {
      pointer.ty = gsap.utils.clamp(-0.5, 0.5, velocity / 40)
    })
  } else {
    addEventListener(
      'pointermove',
      (e) => {
        pointer.tx = e.clientX / innerWidth - 0.5
        pointer.ty = e.clientY / innerHeight - 0.5
      },
      { passive: true },
    )
  }

  // One smoothing step per frame, shared by every hive on the page
  gsap.ticker.add(() => {
    const k = 1 - Math.pow(0.94, gsap.ticker.deltaRatio())
    pointer.x += (pointer.tx - pointer.x) * k
    pointer.y += (pointer.ty - pointer.y) * k
  })

  onPage(({ intro }) => {
    const hives = [...document.querySelectorAll<HTMLElement>('[data-hive]')]
    if (!hives.length) return
    const offs: (() => void)[] = []

    hives.forEach((hive) => {
      const cells = [...hive.querySelectorAll<HTMLElement>('.cell')]
      const floats = cells.map(
        (c) => c.querySelector<HTMLElement>('.cell__float')!,
      )
      const pop = gsap.fromTo(
        floats,
        { scale: 0.4, autoAlpha: 0, rotate: -8 },
        {
          scale: 1,
          autoAlpha: 1,
          rotate: 0,
          duration: 1,
          ease: 'back.out(1.5)',
          stagger: { each: 0.07, from: 'random' },
          paused: true,
        },
      )
      if (hive.dataset.hive === 'intro') intro.add(() => void pop.play(), 0.15)
      else
        ScrollTrigger.create({
          trigger: hive,
          start: 'top 85%',
          once: true,
          onEnter: () => void pop.play(),
        })

      const setters = floats.map((f) => ({
        x: gsap.quickSetter(f, 'x', 'px'),
        y: gsap.quickSetter(f, 'y', 'px'),
        depth: parseFloat(f.parentElement!.dataset.depth || '0.4'),
        phase: parseFloat(f.parentElement!.dataset.i || '0') * 1.37,
      }))
      const tick = (t: number) => {
        for (const s of setters) {
          s.x(pointer.x * s.depth * 36)
          s.y(Math.sin(t * 0.7 + s.phase) * 5 + pointer.y * s.depth * 28)
        }
      }
      const st = ScrollTrigger.create({
        trigger: hive,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) =>
          self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick),
      })
      offs.push(() => {
        gsap.ticker.remove(tick)
        st.kill()
      })
    })
    return () => offs.forEach((f) => f())
  })
}
