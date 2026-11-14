// The mascot: eyes follow the pointer and the mouth changes with its mood.
//   idle      smile
//   surprised pointer is close: small "o", wider pupils
//   happy     pointer is over it, or it was clicked (also hops): big open smile
//   talk      nothing has moved for a while: it glances around and chatters
// Reduced motion: it stays put with a smile.

type Mood = 'idle' | 'surprised' | 'happy' | 'talk'

const FACE = 4 // user units both eyes shift toward the pointer (viewBox is 140 wide)
const PUPIL_X = 3.4 // extra shift of the eye sparkles, which sells the gaze
const PUPIL_Y = 3.4
const REACH = 240 // px from the mascot at which the look is at full strength
const NEAR = 90 // px: closer than this is "surprised"

export function initAvatar() {
  const ava = document.querySelector<HTMLElement>('.ava')
  const eyes = ava?.querySelector<SVGGElement>('.eyes')
  if (!ava || !eyes || matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  const pupils = Array.from(ava.querySelectorAll<SVGGElement>('.pupil'))

  // --- eyes ---------------------------------------------------------------
  // look direction, -1..1 on each axis; `cur` eases toward `goal`
  let goal = { x: 0, y: 0 }
  const cur = { x: 0, y: 0 }
  let raf = 0
  const apply = () => {
    eyes.style.setProperty('--fx', `${(cur.x * FACE).toFixed(2)}px`)
    eyes.style.setProperty('--fy', `${(cur.y * FACE).toFixed(2)}px`)
    for (const p of pupils) {
      p.style.setProperty('--px', `${(cur.x * PUPIL_X).toFixed(2)}px`)
      p.style.setProperty('--py', `${(cur.y * PUPIL_Y).toFixed(2)}px`)
    }
  }
  const tick = () => {
    cur.x += (goal.x - cur.x) * 0.22
    cur.y += (goal.y - cur.y) * 0.22
    apply()
    raf =
      Math.hypot(goal.x - cur.x, goal.y - cur.y) < 0.01
        ? 0
        : requestAnimationFrame(tick)
  }
  const look = (x: number, y: number) => {
    goal = { x, y }
    if (!raf) raf = requestAnimationFrame(tick)
  }

  // --- mood: the highest-priority reason wins -------------------------------
  let hovering = false
  let near = false
  let excited = 0 // timer: click
  let chatter = 0 // timer: idle talk
  const setMood = () => {
    const m: Mood =
      excited || hovering
        ? 'happy'
        : near
          ? 'surprised'
          : chatter
            ? 'talk'
            : 'idle'
    if (ava.dataset.mood !== m) ava.dataset.mood = m
  }
  const hop = () => {
    ava.classList.remove('is-hop')
    void ava.getBoundingClientRect()
    ava.classList.add('is-hop')
  }
  ava.addEventListener('animationend', (e) => {
    if ((e.target as Element).closest('.hop')) ava.classList.remove('is-hop')
  })

  let lastPointer = 0
  document.addEventListener(
    'pointermove',
    (e) => {
      lastPointer = performance.now()
      const r = ava.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / REACH)
      look((dx / d) * k, (dy / d) * k)
      near = d < NEAR
      setMood()
    },
    { passive: true },
  )
  // pointer left the window: look back at the front
  document.documentElement.addEventListener('pointerleave', () => {
    near = false
    hovering = false
    look(0, 0)
    setMood()
  })
  ava.addEventListener('pointerenter', () => {
    hovering = true
    setMood()
  })
  ava.addEventListener('pointerleave', () => {
    hovering = false
    setMood()
  })
  ava.addEventListener('click', () => {
    hop()
    clearTimeout(excited)
    excited = window.setTimeout(() => {
      excited = 0
      setMood()
    }, 1100)
    setMood()
  })

  // --- idle: glance around and chatter ------------------------------------------
  const idle = () => {
    if (
      performance.now() - lastPointer > 4000 &&
      !document.hidden &&
      !hovering
    ) {
      const a = Math.random() * Math.PI * 2
      look(Math.cos(a) * 0.9, Math.sin(a) * 0.6)
      setTimeout(() => look(0, 0), 900 + Math.random() * 700)
      if (Math.random() < 0.6) {
        chatter = window.setTimeout(
          () => {
            chatter = 0
            setMood()
          },
          1200 + Math.random() * 900,
        )
        setMood()
        if (Math.random() < 0.5) hop()
      }
    }
    setTimeout(idle, 3500 + Math.random() * 4000)
  }
  setTimeout(idle, 3000)
}
