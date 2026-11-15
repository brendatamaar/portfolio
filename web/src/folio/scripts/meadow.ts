// Aksara Jawa art: an edelweiss meadow behind a lily pond. The picture is built
// as a density field, then every cell is drawn as one Javanese glyph, picked by
// how much ink it carries (the same trick as ASCII art, with aksara instead of
// `.:+*@`). Aksara are wide, so cells are not a text grid: each glyph is fitted
// into its cell on a <canvas>. Rendered only while visible, ~10 fps; static when
// the reader prefers reduced motion.

const CELL_W = 8 // px
const CELL_H = 6
const CW = CELL_W / CELL_H // a column is CW rows wide
const C = 88
const R = 44
const TAU = Math.PI * 2
export const WIDTH = C * CELL_W
export const HEIGHT = R * CELL_H

// colour classes: edelweiss petal, gold heart, leaf and stem, water, lily petal, lily inner petal, glint
const PET = 1,
  GOLD = 2,
  LEAF = 3,
  WATER = 4,
  LILY = 5,
  TIP = 6,
  SPARK = 7
const VARS = [
  '',
  '--color-edel',
  '--color-cord',
  '--color-thread',
  '--color-water',
  '--color-rose',
  '--color-lily-tip',
  '--color-spark',
]

// glyph ramp, lightest to darkest, with the alpha each is drawn at.
// Order comes from measuring ink coverage inside an 8x6 cell in Noto Sans Javanese Bold.
const JAVA_RAMP: [string, number][] = [
  ['꧈', 0.8],
  ['꧞', 0.85],
  ['꧐', 0.9],
  ['꧖', 0.95],
  ['ꦑ', 1],
  ['ꦫ', 1],
  ['ꦮ', 1],
  ['ꦤ', 1],
  ['ꦛ', 1],
  ['ꦘ', 1],
]
const JAVA_SLIVERS = ['꧍', '꧌'] // tall marks, used for stems
const ASCII_RAMP: [string, number][] = [...'.:-+*ox%#@'].map((c) => [c, 1])
const ASCII_SLIVERS = ['|', '!']
const FAMILY = '"Noto Sans Javanese"'
const EM = 6.8 // reference glyph size in css px

interface Field {
  d: Float32Array
  m: Float32Array
  c: Uint8Array
  s: Uint8Array // 1 where a stem line passes
}
interface Stem {
  x: number
  h: number
  s: number
  ph: number
  lean: number
  a: number // spring: tip offset in rows, and its velocity
  v: number
  sc: number // bloom scale, and its velocity
  sv: number
}
interface Lily {
  x: number
  y: number
  s: number
  ph: number
  h: number // 0: floats on the pad, else the height of its stem
  a: number
  v: number
  sc: number
  sv: number
}
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  ph: number
  col: number
  life: number
  max: number
  kind: 'p' | 's'
  landed: boolean
}
interface Pointer {
  x: number
  y: number
}

export function initMeadow(canvas: HTMLCanvasElement | null) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const pw = Math.round(CELL_W * dpr),
    ph = Math.round(CELL_H * dpr)
  canvas.width = C * pw
  canvas.height = R * ph
  canvas.style.width = `${WIDTH}px`
  canvas.style.height = `${HEIGHT}px`

  const mkRng = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647
  const rng = mkRng(11)
  const grain = Array.from({ length: C * R }, rng)

  // ---- the density field ---------------------------------------------------
  const field = (): Field => ({
    d: new Float32Array(C * R),
    m: new Float32Array(C * R),
    c: new Uint8Array(C * R),
    s: new Uint8Array(C * R),
  })
  let F = field()
  const put = (q: number, amt: number, col: number, keepMax = false) => {
    if (keepMax) {
      if (F.d[q] < amt) F.d[q] = amt
    } else F.d[q] += amt
    if (amt > F.m[q]) {
      F.m[q] = amt
      F.c[q] = col
    }
  }
  // soft ellipse; cx in columns, cy in rows, rx/ry in rows
  function ell(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    amt: number,
    col: number,
    ang = 0,
    hard = 0.35,
  ) {
    rx = Math.max(rx, 0.55)
    ry = Math.max(ry, 0.55)
    const ca = Math.cos(ang),
      sa = Math.sin(ang),
      ext = Math.max(rx, ry)
    const i0 = Math.max(0, Math.floor(cx - ext / CW) - 1),
      i1 = Math.min(C - 1, Math.ceil(cx + ext / CW) + 1)
    const j0 = Math.max(0, Math.floor(cy - ext) - 1),
      j1 = Math.min(R - 1, Math.ceil(cy + ext) + 1)
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const x = (i - cx) * CW,
          y = j - cy
        const u = (x * ca + y * sa) / rx,
          v = (-x * sa + y * ca) / ry,
          r = u * u + v * v
        if (r < 1) put(j * C + i, amt * Math.min(1, (1 - r) / hard), col)
      }
  }
  function seg(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    amt: number,
    col: number,
    stem = false,
  ) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1
    for (let k = 0; k <= n; k++) {
      const i = Math.round(x0 + ((x1 - x0) * k) / n),
        j = Math.round(y0 + ((y1 - y0) * k) / n)
      if (i >= 0 && i < C && j >= 0 && j < R) {
        put(j * C + i, amt, col, true)
        if (stem) F.s[j * C + i] = 1
      }
    }
  }
  // an ellipse whose centre sits `dist` rows from (x, y) along angle a
  const pet = (
    x: number,
    y: number,
    a: number,
    dist: number,
    rx: number,
    ry: number,
    amt: number,
    col: number,
  ) =>
    ell(
      x + (Math.cos(a) * dist) / CW,
      y + Math.sin(a) * dist,
      rx,
      ry,
      amt,
      col,
      a,
    )
  const leaf = (x: number, y: number, a: number, len: number) =>
    pet(x, y, a, len * 0.5, len * 0.5, 0.85, 0.5, LEAF)

  // edelweiss: two rings of woolly bracts around a gold heart
  function edelweiss(x: number, y: number, s: number) {
    for (let k = 0; k < 8; k++)
      pet(x, y, (k * TAU) / 8, s * 0.82, s * 0.84, s * 0.15, 0.6, PET)
    for (let k = 0; k < 8; k++)
      pet(x, y, ((k + 0.5) * TAU) / 8, s * 0.27, s * 0.32, s * 0.19, 0.75, PET)
    for (let k = 0; k < 5; k++) {
      const a = (k * TAU) / 5
      ell(
        x + (Math.cos(a) * s * 0.2) / CW,
        y + Math.sin(a) * s * 0.2,
        s * 0.13,
        s * 0.13,
        0.9,
        GOLD,
      )
    }
    ell(x, y, s * 0.14, s * 0.14, 1, GOLD)
  }
  // lily: a fan of pointed petals standing on its own pad
  function lily(x: number, y: number, s: number) {
    ell(x, y + s * 0.78, s * 1.15, s * 0.2, 0.42, LEAF)
    for (const d of [-1.0, 1.0, -0.5, 0.5])
      pet(
        x,
        y + s * 0.5,
        -Math.PI / 2 + d,
        s * 0.72,
        s * 0.78,
        s * 0.27,
        0.52,
        LILY,
      )
    for (const d of [-0.22, 0.22, 0])
      pet(
        x,
        y + s * 0.5,
        -Math.PI / 2 + d,
        s * 0.68,
        s * 0.74,
        s * 0.26,
        0.66,
        TIP,
      )
    ell(x, y + s * 0.35, s * 0.2, s * 0.18, 0.95, GOLD)
  }
  const near = (ptr: Pointer | null, x: number, y: number, r: number) => {
    if (!ptr) return 0
    const d = Math.hypot((x - ptr.x) * CW, y - ptr.y)
    return d > r ? 0 : 1 - d / r
  }

  // ---- the scene -----------------------------------------------------------
  const BANK = R - 8 // where the meadow stems start
  const stems: Stem[] = []
  const N = 21
  for (let i = 0; i < N; i++) {
    const h = 9 + rng() * 16
    stems.push({
      x: 3 + (i / (N - 1)) * (C - 6) + (rng() - 0.5) * 2.5,
      h,
      s: 2.7 + (2.3 * (h - 9)) / 16,
      ph: rng() * TAU,
      lean: (rng() - 0.5) * 2,
      a: 0,
      v: 0,
      sc: 1,
      sv: 0,
    })
  }
  stems.sort((a, b) => b.h - a.h) // tall first, short ones stand in front
  const lilies: Lily[] = []
  for (let i = 0; i < 10; i++)
    lilies.push({
      x: 5 + (i / 9) * (C - 10) + (rng() - 0.5) * 3,
      y: R - 3.3 - rng() * 1.4,
      s: 2.4 + rng() * 2,
      ph: rng() * TAU,
      h: 0,
      a: 0,
      v: 0,
      sc: 1,
      sv: 0,
    })
  for (const x of [12, 34, 57, 77])
    lilies.push({
      x: x + (rng() - 0.5) * 4,
      y: 0,
      s: 3.1 + rng() * 0.9,
      ph: rng() * TAU,
      h: 14 + rng() * 5,
      a: 0,
      v: 0,
      sc: 1,
      sv: 0,
    })

  // ---- physics -------------------------------------------------------------
  // Stems and blooms are damped springs, the water is a wave equation on a
  // small grid, petals fall under gravity and drag and are blown about by the
  // pointer's motion. Everything advances in fixed sub-steps, so a slow frame
  // does not change how it behaves.
  const SUB = 1 / 90
  const K = 22 // stem spring stiffness (about 0.75 Hz)
  const DAMP = 2.2 // a little under-damped: a flick rings for a second
  const PUSH = 60 // steady push of the pointer on a stem it touches
  const FLICK = 1.4 // push from the pointer's speed
  const WR = 5 // rows of water
  const WY = R - WR // first water row
  const WAVE = 40 // wave speed squared
  const GRAV = 5.2
  const AIR = 1.5 // petal drag
  const wh = new Float32Array(C * WR) // water height
  const wv = new Float32Array(C * WR) // and its velocity
  let ptr: Pointer | null = null
  const pv = { x: 0, y: 0 } // pointer velocity in rows per second
  let active = false // anything still moving fast enough to need smooth frames

  const splash = (col: number, row: number, amp: number) => {
    const i = Math.max(1, Math.min(C - 2, Math.round(col))),
      j = Math.max(0, Math.min(WR - 1, Math.round(row - WY)))
    wv[j * C + i] += amp
    wv[j * C + i - 1] += amp * 0.5
    wv[j * C + i + 1] += amp * 0.5
  }
  const waterAt = (col: number) =>
    wh[(WR - 3) * C + Math.max(0, Math.min(C - 1, Math.round(col)))]

  // how hard the pointer pushes a spring that stands at column x between rows top and bottom
  function pointerForce(x: number, top: number, bottom: number, h: number) {
    if (!ptr) return 0
    const dx = (x - ptr.x) * CW
    const dy = ptr.y < top ? top - ptr.y : ptr.y > bottom ? ptr.y - bottom : 0
    const g = Math.exp(-(dx * dx) / 32 - (dy * dy) / 18)
    const along = Math.min(1, Math.max(0.15, (bottom - ptr.y) / h))
    return (
      (Math.tanh(dx * 0.6) * PUSH + pv.x * FLICK) * g * Math.pow(along, 1.7)
    )
  }
  const bloomTarget = (x: number, y: number) => 1 + near(ptr, x, y, 9) * 0.35

  function spring(
    b: { a: number; v: number; sc: number; sv: number },
    f: number,
    target: number,
    h: number,
  ) {
    b.v += (f - K * b.a - DAMP * b.v) * h
    b.a = Math.max(-7, Math.min(7, b.a + b.v * h))
    b.sv += (60 * (target - b.sc) - 5 * b.sv) * h // blooms swell and settle with a little bounce
    b.sc += b.sv * h
  }

  // ---- particles: petals that drift down, glints that blink ---------------
  let parts: Particle[] = []
  let blooms: [number, number, number][] = [] // x, y, petal colour
  const spawnPetal = (
    x: number,
    y: number,
    col: number,
    vx = (rng() - 0.5) * 2.2,
    vy = 0.4,
  ) =>
    parts.push({
      x,
      y,
      vx,
      vy,
      ph: rng() * TAU,
      col,
      life: 0,
      max: 99,
      kind: 'p',
      landed: false,
    })
  const spawnSpark = (x: number, y: number) =>
    parts.push({
      x: x + (rng() - 0.5) * 5,
      y: y + (rng() - 0.5) * 3,
      vx: 0,
      vy: 0,
      ph: 0,
      col: SPARK,
      life: 0,
      max: 0.7 + rng() * 0.5,
      kind: 's',
      landed: false,
    })
  if (reduce)
    for (let k = 0; k < 18; k++)
      parts.push({
        x: rng() * C,
        y: 6 + rng() * (R - 9),
        vx: 0,
        vy: 0,
        ph: 0,
        col: k % 3 ? PET : LILY,
        life: 0,
        max: 99,
        kind: 'p',
        landed: false,
      })

  function simulate(t: number, dt: number) {
    const n = Math.max(1, Math.ceil(dt / SUB)),
      h = dt / n
    let energy = 0
    for (let s = 0; s < n; s++) {
      for (const st of stems) {
        const f = pointerForce(st.x, BANK - st.h, BANK, st.h)
        spring(st, f, bloomTarget(st.x, BANK - st.h), h)
      }
      for (const L of lilies) {
        if (L.h > 0)
          spring(
            L,
            pointerForce(L.x, R - 2 - L.h, R - 2, L.h),
            bloomTarget(L.x, R - 2 - L.h),
            h,
          )
        else {
          L.sv += (60 * (bloomTarget(L.x, L.y) - L.sc) - 5 * L.sv) * h
          L.sc += L.sv * h
        }
      }
      // water: wave equation, the grid is wider than it is tall so columns count less
      for (let j = 0; j < WR; j++)
        for (let i = 0; i < C; i++) {
          const q = j * C + i,
            c = wh[q]
          const l = i > 0 ? wh[q - 1] : c,
            r = i < C - 1 ? wh[q + 1] : c,
            u = j > 0 ? wh[q - C] : c,
            d = j < WR - 1 ? wh[q + C] : c
          wv[q] +=
            (WAVE * (0.56 * (l + r - 2 * c) + (u + d - 2 * c)) - 2.2 * wv[q]) *
            h
        }
      for (let q = 0; q < C * WR; q++) wh[q] += wv[q] * h
    }
    for (const st of stems) energy += st.a * st.a + st.v * st.v * 0.05
    for (const L of lilies) if (L.h > 0) energy += L.a * L.a + L.v * L.v * 0.05
    let wave = 0
    for (let q = 0; q < C * WR; q++) wave = Math.max(wave, Math.abs(wh[q]))
    active = !!ptr || energy > 0.05 || wave > 0.08

    // the pointer's speed fades if no new move arrives
    const fade = Math.exp(-dt * 5)
    pv.x *= fade
    pv.y *= fade
    if (ptr && ptr.y > WY - 1.5) {
      const sp = Math.hypot(pv.x, pv.y)
      if (sp > 4)
        splash(ptr.x, ptr.y, Math.min(9, sp * 0.14) * (rng() < 0.5 ? 1 : -1))
    }
    if (rng() < dt * 0.5) splash(rng() * C, WY + rng() * WR, 3.5) // now and then a drop

    // blooms drop petals and sparkle; the water glints
    if (rng() < dt * 4 && blooms.length) {
      const [x, y, col] = blooms[Math.floor(rng() * blooms.length)]
      spawnPetal(x, y, col)
    }
    if (rng() < dt * 3.5 && blooms.length) {
      const [x, y] = blooms[Math.floor(rng() * blooms.length)]
      spawnSpark(x, y)
    }
    if (rng() < dt * 2.5) spawnSpark(rng() * C, WY + rng() * 3.5)

    for (const p of parts) {
      p.life += dt
      if (p.kind !== 'p') continue
      if (!p.landed) {
        // air: a gentle gust, the pointer's wake, and a flutter as the petal tumbles
        let wx = Math.sin(t * 0.7 + p.y * 0.15) * 0.9,
          wy = 0
        if (ptr) {
          const dx = (p.x - ptr.x) * CW,
            dy = p.y - ptr.y,
            d = Math.hypot(dx, dy),
            g = Math.exp(-(d * d) / 40)
          wx += (pv.x * 0.55 + (dx / (d + 0.5)) * 9) * g
          wy += (pv.y * 0.55 + (dy / (d + 0.5)) * 9) * g
        }
        const flutter = Math.sin(t * 3.4 + p.ph) * 2.4
        for (let s = 0; s < n; s++) {
          p.vx += (wx + flutter - p.vx) * AIR * h
          p.vy += (GRAV + AIR * (wy - p.vy)) * h
          p.x += (p.vx * h) / CW
          p.y += p.vy * h
        }
        if (p.y > WY + 0.3) {
          p.landed = true
          p.max = p.life + 2 + rng() * 1.6 // floats a while, then goes
          p.vy *= 0.15
          splash(p.x, p.y, 3.5)
        }
      } else {
        // floating: pulled to the surface, nudged along by the ripples
        const i = Math.max(1, Math.min(C - 2, Math.round(p.x))),
          row = (WR - 3) * C
        const hh = wh[row + i],
          slope = wh[row + i + 1] - wh[row + i - 1]
        for (let s = 0; s < n; s++) {
          p.vy += ((WY + 0.7 - hh * 0.6 - p.y) * 40 - 6 * p.vy) * h
          p.y += p.vy * h
          p.vx += (-p.vx * 2.5 - slope * 8) * h
          p.x += (p.vx * h) / CW
        }
      }
    }
    parts = parts
      .filter((p) => p.y < R && p.x > -2 && p.x < C + 2 && p.life < p.max)
      .slice(-90)
  }

  function draw(t: number) {
    F = field()
    blooms = []

    // meadow
    for (const st of stems) {
      let px = st.x,
        py = BANK
      const n = Math.ceil(st.h)
      for (let k = 1; k <= n; k++) {
        const u = k / n,
          depth = Math.pow(u, 1.7)
        const sway = reduce
          ? 0
          : (1.1 * Math.sin(t * 0.8 + st.ph + st.x * 0.06) +
              0.35 * Math.sin(t * 2.1 + st.ph * 2)) *
            depth
        const x = st.x + (st.lean * u * u * 1.5 + sway + st.a * depth) / CW,
          y = BANK - st.h * u
        seg(px, py, x, y, 0.42, LEAF, true)
        if (k === Math.round(n * 0.3) || k === Math.round(n * 0.55)) {
          const side = k % 2 ? 1 : -1
          leaf(
            x,
            y,
            -Math.PI / 2 + side * 1.0 + st.a * depth * 0.08,
            3.3 + st.s * 0.3,
          )
        }
        px = x
        py = y
      }
      edelweiss(px, py - st.s * 0.4, st.s * st.sc)
      blooms.push([px, py - st.s * 0.4, PET])
    }

    // water: a faint ripple pattern, and the waves on top of it
    for (let j = 0; j < WR; j++)
      for (let i = 0; i < C; i++) {
        const q = (WY + j) * C + i,
          hh = wh[j * C + i]
        const v =
          Math.sin(i * 0.7 + (WY + j) * 2.1 + t * 1.3) *
          Math.sin(i * 0.23 - t * 0.5 + WY + j)
        if (v > 0.55) put(q, 0.16 + (0.22 * (v - 0.55)) / 0.45, WATER, true)
        if (Math.abs(hh) > 0.18)
          put(q, Math.min(0.75, Math.abs(hh) * 0.7), WATER, true)
        if (hh > 0.5) put(q, 0.4, SPARK, true) // a crest catches the light
      }

    // lilies: tall stems first, then the ones floating on pads
    for (const L of [...lilies].sort((a, b) => b.h - a.h)) {
      const bob = reduce
        ? 0
        : 0.25 * Math.sin(t * 1.1 + L.ph) +
          Math.max(-1.2, Math.min(1.2, waterAt(L.x) * 0.9))
      if (L.h > 0) {
        let px = L.x,
          py = R - 2
        const n = Math.ceil(L.h)
        for (let k = 1; k <= n; k++) {
          const u = k / n,
            depth = Math.pow(u, 1.6)
          const x =
              L.x +
              (((reduce ? 0 : 0.7 * Math.sin(t * 0.9 + L.ph)) + L.a) * depth) /
                CW,
            y = R - 2 - L.h * u
          seg(px, py, x, y, 0.42, LEAF, true)
          px = x
          py = y
        }
        leaf(L.x, R - 2, -2.6, 5)
        leaf(L.x, R - 2, -0.55, 5)
        lily(px, py - L.s * 0.4 + bob, L.s * L.sc)
        blooms.push([px, py - L.s * 0.4, LILY])
      } else {
        ell(L.x - L.s * 2.6, L.y + 0.5 + bob, L.s * 1.6, 0.8, 0.38, LEAF)
        ell(L.x + L.s * 2.8, L.y + 0.2 + bob, L.s * 1.2, 0.7, 0.36, LEAF)
        const s = L.s * L.sc
        lily(L.x, L.y - s * 0.78 + bob, s)
        blooms.push([L.x, L.y - s * 0.78 + bob, LILY])
      }
    }
  }

  // ---- glyph sprites -------------------------------------------------------
  let ramp = JAVA_RAMP
  let slivers = JAVA_SLIVERS
  let family = FAMILY
  const L = () => ramp.length
  let sprites: HTMLCanvasElement[][] = [] // [class][level]; slivers follow the ramp
  let spriteKey = ''
  const cs = getComputedStyle(canvas)

  function sprite(ch: string, color: string, alpha: number) {
    const s = document.createElement('canvas')
    s.width = pw
    s.height = ph
    const x = s.getContext('2d')!
    x.font = `700 ${EM * (pw / CELL_W)}px ${family}`
    x.textBaseline = 'alphabetic'
    x.textAlign = 'left'
    const m = x.measureText(ch)
    const iw = Math.max(1, m.actualBoundingBoxLeft + m.actualBoundingBoxRight),
      ih = Math.max(1, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)
    // keep the glyph whole in its cell, and stretch it a little taller
    const sx = Math.min(1, (pw * 0.96) / iw),
      sy = Math.min(sx * 1.45, (ph * 0.94) / ih)
    x.fillStyle = color
    x.globalAlpha = alpha
    x.translate(
      pw / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2) * sx,
      ph / 2 -
        ((m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2) * sy,
    )
    x.scale(sx, sy)
    x.fillText(ch, 0, 0)
    return s
  }
  function buildSprites() {
    const key = VARS.map((v) => (v ? cs.getPropertyValue(v).trim() : '')).join(
      '|',
    )
    if (key === spriteKey) return
    spriteKey = key
    sprites = VARS.map((v) => {
      if (!v) return []
      const color = cs.getPropertyValue(v).trim() || '#888'
      return [
        ...ramp.map(([ch, a]) => sprite(ch, color, a)),
        ...slivers.map((ch) => sprite(ch, color, 1)),
      ]
    })
  }

  function paint() {
    buildSprites()
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
    const cellAt = (q: number, d: number) => {
      const lvl = Math.min(L() - 1, Math.floor(Math.min(1, d) * L()))
      // a thin stem line reads better as a tall mark than as a letter
      if (F.s[q] && F.c[q] === LEAF && d < 0.8)
        return L() + (q % slivers.length)
      return lvl
    }
    for (let q = 0; q < C * R; q++) {
      const d = F.d[q] * (0.86 + grain[q] * 0.28)
      if (d < 0.07) continue
      const cls = F.c[q]
      if (cls)
        ctx!.drawImage(
          sprites[cls][cellAt(q, d)],
          (q % C) * pw,
          Math.floor(q / C) * ph,
        )
    }
    for (const p of parts) {
      const i = Math.round(p.x),
        j = Math.round(p.y)
      if (i < 0 || i >= C || j < 0 || j >= R) continue
      const q = j * C + i
      let lvl = 2
      if (p.kind === 's')
        lvl = p.life < p.max * 0.3 ? 5 : p.life < p.max * 0.65 ? 3 : 1
      else if (p.landed) lvl = p.max - p.life < 0.8 ? 0 : 1
      if (p.kind === 's' || F.d[q] < 0.3)
        ctx!.drawImage(sprites[p.col][lvl], i * pw, j * ph)
    }
  }

  // ---- loop and pointer ----------------------------------------------------
  let lastMove = 0
  let trail = 0 // distance moved since the last petal was shaken loose
  let raf = 0,
    last = 0,
    prev = performance.now(),
    visible = false
  const t0 = performance.now()
  const render = (now: number) => {
    raf = 0
    const dt = Math.min(0.1, (now - prev) / 1000)
    prev = now
    const t = (now - t0) / 1000
    if (!reduce) simulate(t, dt)
    draw(t)
    paint()
  }

  const start = () => {
    render(performance.now())
    if (reduce) return // a still picture
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    }).observe(canvas)
    const loop = (now: number) => {
      // smooth frames while something is moving, a slow drift otherwise
      if (visible && now - last >= (active ? 28 : 86)) {
        last = now
        render(now)
      } else if (!visible) prev = now
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / r.width) * C,
        ny = ((e.clientY - r.top) / r.height) * R
      if (ptr && lastMove) {
        const s = Math.max(0.008, (e.timeStamp - lastMove) / 1000)
        const vx = ((nx - ptr.x) * CW) / s,
          vy = (ny - ptr.y) / s
        const clamp = (v: number) => Math.max(-120, Math.min(120, v))
        pv.x = clamp(pv.x * 0.5 + vx * 0.5)
        pv.y = clamp(pv.y * 0.5 + vy * 0.5)
        trail += Math.hypot((nx - ptr.x) * CW, ny - ptr.y)
        if (trail > 2.5 && ny < WY - 1) {
          trail = 0
          spawnPetal(
            nx,
            ny,
            rng() < 0.4 ? LILY : PET,
            pv.x * 0.35 + (rng() - 0.5) * 3,
            pv.y * 0.35 + (rng() - 0.5) * 3,
          )
          if (rng() < 0.5) spawnSpark(nx, ny)
        }
      }
      lastMove = e.timeStamp
      ptr = { x: nx, y: ny }
    })
    canvas.addEventListener('pointerleave', () => {
      ptr = null
      lastMove = 0
    })
  }

  // the aksara font loads on demand; without it the same picture is drawn in ASCII
  const glyphs = [...JAVA_RAMP.map(([c]) => c), ...JAVA_SLIVERS].join('')
  document.fonts
    .load(`700 12px ${FAMILY}`, glyphs)
    .then(
      (f) => f.length > 0,
      () => false,
    )
    .then((ok) => {
      if (!ok) {
        ramp = ASCII_RAMP
        slivers = ASCII_SLIVERS
        family = 'ui-monospace, Menlo, Consolas, monospace'
      }
      start()
    })
}
