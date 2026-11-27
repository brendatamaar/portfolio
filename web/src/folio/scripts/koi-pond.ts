import { createPondPainter, JAVANESE_FONT, JAVANESE_GLYPHS } from './koi-paint'
import {
  createPond,
  HEIGHT,
  pondOutline,
  step,
  TIMESTEP,
  WIDTH,
  type Point,
  type Ripple,
  type Tick,
} from './koi-physics'

export function initKoiPond(button: HTMLButtonElement | null) {
  const canvas = button?.querySelector('canvas')
  if (!button || !canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const scheme = matchMedia('(prefers-color-scheme: light)')
  const { paint, hitKoi } = createPondPainter(ctx)
  const coarsePointer = matchMedia('(pointer: coarse)')
  let pond = createPond()
  let pointer: Point | null = null
  let wake: Point | null = null
  let ripples: Ripple[] = []
  let clicks: Tick['clicks'] = []
  let hasGlyphs = false
  let light = false
  let visible = false
  let frame = 0
  let previousTime: number | null = null
  let elapsed = 0
  let scaleX = 1
  let scaleY = 1
  let drawn = false

  const readLight = () => {
    const theme = document.documentElement.dataset.theme
    return theme === 'light' || (theme !== 'dark' && scheme.matches)
  }

  const draw = () => {
    drawn = true
    paint(pond, hasGlyphs, light, scaleX, scaleY)
  }

  function updateTheme() {
    const next = readLight()
    if (next === light && drawn) return
    light = next
    draw()
  }

  const resize = (force = false) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round((width * HEIGHT) / WIDTH))
    const changed = canvas.width !== width || canvas.height !== height
    if (changed) {
      canvas.width = width
      canvas.height = height
    }
    if (!changed && !force && drawn) return
    scaleX = width / WIDTH
    scaleY = height / HEIGHT
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0)
    draw()
  }

  function animate(now: number) {
    frame = requestAnimationFrame(animate)
    elapsed += Math.min(0.05, (now - (previousTime ?? now)) / 1000)
    previousTime = now
    const frameTolerance = 0.0003
    if (elapsed + frameTolerance < TIMESTEP) return
    while (elapsed + frameTolerance >= TIMESTEP) {
      pond = step(pond, { pointer, ripples, clicks })
      ripples = []
      clicks = []
      elapsed -= TIMESTEP
    }
    draw()
  }

  function updatePlayback() {
    if (visible && !motion.matches && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(frame)
      frame = 0
      previousTime = null
      elapsed = 0
      pointer = wake = null
      ripples = []
      clicks = []
    }
  }

  const updateMotion = () => {
    button.disabled = motion.matches
    if (motion.matches) {
      pond = createPond()
      draw()
    }
    updatePlayback()
  }

  const locate = (event: MouseEvent): Point => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.min(
        WIDTH,
        Math.max(0, ((event.clientX - rect.left) / rect.width) * WIDTH),
      ),
      y: Math.min(
        HEIGHT,
        Math.max(0, ((event.clientY - rect.top) / rect.height) * HEIGHT),
      ),
    }
  }

  button.addEventListener('pointermove', (event) => {
    if (!frame) return
    const point = locate(event)
    if (pondOutline(point.x, point.y) > 1) {
      clearPointer()
      return
    }
    pointer = point
    const distance = wake
      ? Math.hypot(pointer.x - wake.x, pointer.y - wake.y)
      : 0
    if (wake && distance < 14) return
    wake = pointer
    if (ripples.length < 8)
      ripples.push({
        ...pointer,
        strength: Math.min(0.6, 0.22 + distance * 0.009),
      })
  })
  const clearPointer = () => {
    pointer = wake = null
  }
  button.addEventListener('pointerleave', clearPointer)
  button.addEventListener('pointercancel', clearPointer)
  button.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'mouse') clearPointer()
  })
  button.addEventListener('click', (event) => {
    if (!frame) return
    if (event.detail === 0) {
      clicks.push({ x: WIDTH / 2, y: HEIGHT / 2, fish: null })
      return
    }
    const point = locate(event)
    const touch =
      event instanceof PointerEvent
        ? event.pointerType === 'touch'
        : coarsePointer.matches
    const hit = hitKoi(point, touch ? (8 * WIDTH) / canvas.clientWidth : 5)
    clicks.push({ ...point, fish: hit })
  })

  light = readLight()
  requestAnimationFrame(() => resize(true))
  button.disabled = motion.matches
  new ResizeObserver(() => resize()).observe(button)
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    updatePlayback()
  }).observe(button)
  document.addEventListener('visibilitychange', updatePlayback)
  motion.addEventListener('change', updateMotion)
  scheme.addEventListener('change', updateTheme)
  window.addEventListener('resize', () => resize())
  new MutationObserver(updateTheme).observe(document.documentElement, {
    attributeFilter: ['data-theme'],
  })

  document.fonts.load(JAVANESE_FONT, JAVANESE_GLYPHS).then(
    (fonts) => {
      if (fonts.length === 0) return
      hasGlyphs = true
      if (drawn) draw()
    },
    () => {
      /* Keep drawing with the ASCII ramp when the Javanese font is unavailable. */
    },
  )
}
