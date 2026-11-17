import { initial, moods, step, type Input } from './avatar-state'

// The cloud stays anchored; only a gentle breath and the eyes animate.
let dispose: (() => void) | undefined

export function initAvatar() {
  dispose?.()
  const ava = document.querySelector<HTMLButtonElement>('.ava')
  const face = ava?.querySelector<HTMLElement>('.face')
  if (!ava || !face) return
  const controller = new AbortController()
  const options = { signal: controller.signal }
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let state = initial
  let frame = 0
  let resetTimer = 0
  let lastPointer = performance.now()
  let goal = { x: 0, y: 0 }
  const current = { x: 0, y: 0 }
  const dispatch = (input: Input) => {
    const [next, commands] = step(state, input)
    state = next
    for (const command of commands) {
      switch (command.tag) {
        case 'schedule-reset':
          window.clearTimeout(resetTimer)
          resetTimer = window.setTimeout(() => {
            dispatch({ tag: 'expired', generation: command.generation })
          }, command.after)
          break
        case 'cancel-reset':
          window.clearTimeout(resetTimer)
          resetGaze()
          break
        case 'render':
          ava.dataset.mood = command.mood
          ava.setAttribute(
            'aria-label',
            `Cloud mascot: ${command.mood}. Activate to change expression.`,
          )
          break
      }
    }
  }
  const tick = () => {
    current.x += (goal.x - current.x) * 0.18
    current.y += (goal.y - current.y) * 0.18
    face.style.setProperty('--gx', `${current.x.toFixed(2)}px`)
    face.style.setProperty('--gy', `${current.y.toFixed(2)}px`)
    frame =
      Math.hypot(goal.x - current.x, goal.y - current.y) > 0.01
        ? requestAnimationFrame(tick)
        : 0
  }
  const look = (x: number, y: number) => {
    goal = { x, y }
    if (!frame) frame = requestAnimationFrame(tick)
  }
  const resetGaze = () => {
    cancelAnimationFrame(frame)
    frame = 0
    goal = { x: 0, y: 0 }
    current.x = current.y = 0
    face.style.removeProperty('--gx')
    face.style.removeProperty('--gy')
    delete ava.dataset.motion
  }
  const syncMotion = () => {
    ava.toggleAttribute('data-paused', document.hidden || motion.matches)
    if (document.hidden || motion.matches) {
      resetGaze()
      dispatch({ tag: 'reset' })
    }
  }
  ava.dataset.mood = initial.mood
  ava.setAttribute(
    'aria-label',
    'Cloud mascot: neutral. Activate to change expression.',
  )
  syncMotion()
  document.addEventListener(
    'pointermove',
    (event) => {
      if (motion.matches || document.hidden) return
      lastPointer = performance.now()
      delete ava.dataset.motion
      const rect = ava.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      const distance = Math.hypot(dx, dy) || 1
      const strength = Math.min(1, distance / 240)
      dispatch({ tag: 'attention', near: distance < 90 })
      look((dx / distance) * strength * 4, (dy / distance) * strength * 3)
    },
    { ...options, passive: true },
  )
  ava.addEventListener(
    'pointerenter',
    () => dispatch({ tag: 'hover' }),
    options,
  )
  ava.addEventListener(
    'pointerleave',
    () => dispatch({ tag: 'leave' }),
    options,
  )
  ava.addEventListener(
    'click',
    () => {
      lastPointer = performance.now()
      resetGaze()
      dispatch({ tag: 'select' })
    },
    options,
  )
  document.documentElement.addEventListener(
    'pointerleave',
    () => {
      resetGaze()
      dispatch({ tag: 'leave' })
    },
    options,
  )
  document.addEventListener('visibilitychange', syncMotion, options)
  motion.addEventListener('change', syncMotion, options)
  ava.addEventListener(
    'animationend',
    (event) => {
      if (event.animationName === 'eyes-turn') delete ava.dataset.motion
    },
    options,
  )
  const idle = window.setInterval(() => {
    if (
      document.hidden ||
      motion.matches ||
      state.tag === 'temporary' ||
      ava.matches(':hover, :focus-visible') ||
      performance.now() - lastPointer < 5000
    )
      return
    resetGaze()
    dispatch({
      tag: 'idle',
      mood: moods[1 + Math.floor(Math.random() * (moods.length - 1))],
    })
    ava.dataset.motion = Math.random() < 0.25 ? 'turn' : 'look'
  }, 8000)
  dispose = () => {
    controller.abort()
    window.clearInterval(idle)
    window.clearTimeout(resetTimer)
    resetGaze()
  }
  document.addEventListener('astro:before-swap', dispose, {
    ...options,
    once: true,
  })
}
