// ASCII art: roncean melati, the jasmine strands hung at Javanese weddings,
// with falling petals and sparkles. Canvas-free: each frame is a <pre> of
// colour-run spans. Rendered only while visible, ~10 fps; static when the
// reader prefers reduced motion.

const RAMP = ' .:-=+*ox%#@'
const CW = 0.6 // a character cell is 0.6 rows wide
const TAU = Math.PI * 2
const C = 176
const R = 46
const J = 1,
  B = 2,
  TH = 3,
  RL = 4,
  RO = 5,
  SP = 6 // jasmine, flower heart, thread, gold cord, rose, sparkle
const CLS = ['', 'cj', 'cb', 'ct', 'cr', 'cp', 'cs']
const PETALS = ["'", '.', ',', '*', '`', "'"]
const N = 20

interface Field {
  d: Float32Array
  m: Float32Array
  c: Uint8Array
}
interface Strand {
  x: number
  len: number
  ph: number
  every: number
  off: number
  rose: boolean
}
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  ph: number
  ch: string
  col: number
  life: number
  max: number
  kind: 'p' | 's'
}
interface Pointer {
  x: number
  y: number
}

export function initGarland(pre: HTMLPreElement | null) {
  if (!pre) return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const mkRng = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647
  const rng = mkRng(11)
  const grain = Array.from({ length: C * R }, rng)

  const field = (): Field => ({
    d: new Float32Array(C * R),
    m: new Float32Array(C * R),
    c: new Uint8Array(C * R),
  })
  const put = (
    F: Field,
    q: number,
    amt: number,
    col: number,
    keepMax = false,
  ) => {
    if (keepMax) {
      if (F.d[q] < amt) F.d[q] = amt
    } else F.d[q] += amt
    if (amt > F.m[q]) {
      F.m[q] = amt
      F.c[q] = col
    }
  }
  // soft ellipse; cx in columns, cy in rows, rx/ry in row units
  function ell(
    F: Field,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    amt: number,
    col: number,
    ang = 0,
    hard = 0.35,
  ) {
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
        if (r < 1) put(F, j * C + i, amt * Math.min(1, (1 - r) / hard), col)
      }
  }
  function seg(
    F: Field,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    amt: number,
    col: number,
  ) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1
    for (let k = 0; k <= n; k++) {
      const i = Math.round(x0 + ((x1 - x0) * k) / n),
        j = Math.round(y0 + ((y1 - y0) * k) / n)
      if (i >= 0 && i < C && j >= 0 && j < R) put(F, j * C + i, amt, col, true)
    }
  }
  function flower(
    F: Field,
    x: number,
    y: number,
    s: number,
    amt: number,
    rot: number,
    col: number,
  ) {
    for (let p = 0; p < 6; p++) {
      const a = rot + (p * TAU) / 6
      ell(
        F,
        x + (Math.cos(a) * s * 0.62) / CW,
        y + Math.sin(a) * s * 0.62,
        s * 0.52,
        s * 0.26,
        amt,
        col,
        a,
      )
    }
    ell(F, x, y, s * 0.26, s * 0.26, 0.9, col === RO ? RO : B)
  }
  const near = (ptr: Pointer | null, x: number, y: number, r: number) => {
    if (!ptr) return 0
    const d = Math.hypot((x - ptr.x) * CW, y - ptr.y)
    return d > r ? 0 : 1 - d / r
  }

  const strands: Strand[] = []
  for (let s = 0; s < N; s++) {
    const f = s / (N - 1)
    strands.push({
      x: 4 + f * (C - 8),
      len: Math.min(
        R - 6,
        15 + 21 * Math.pow(Math.sin(Math.PI * f), 1.3) + rng() * 6,
      ),
      ph: rng() * TAU,
      every: 4 + Math.floor(rng() * 3),
      off: Math.floor(rng() * 3),
      rose: s % 3 === 1,
    })
  }

  // falling petals and sparkles
  let parts: Particle[] = []
  let blooms: [number, number][] = []
  const spawnPetal = (x: number, y: number, burst = false) => {
    parts.push({
      x,
      y,
      vx: (rng() - 0.5) * (burst ? 9 : 2.5),
      vy: 2 + rng() * 2.6,
      ph: rng() * TAU,
      ch: PETALS[Math.floor(rng() * PETALS.length)],
      col: rng() < 0.38 ? RO : J,
      life: 0,
      max: 99,
      kind: 'p',
    })
  }
  const spawnSpark = (x: number, y: number) =>
    parts.push({
      x: x + (rng() - 0.5) * 6,
      y: y + (rng() - 0.5) * 3,
      vx: 0,
      vy: 0,
      ph: 0,
      ch: '+',
      col: SP,
      life: 0,
      max: 0.7 + rng() * 0.5,
      kind: 's',
    })
  if (reduce)
    for (let k = 0; k < 26; k++)
      parts.push({
        x: rng() * C,
        y: 6 + rng() * (R - 8),
        vx: 0,
        vy: 0,
        ph: 0,
        ch: PETALS[k % PETALS.length],
        col: k % 3 ? J : RO,
        life: 0,
        max: 99,
        kind: 'p',
      })

  function draw(t: number, dt: number, ptr: Pointer | null) {
    const F = field()
    blooms = []
    seg(F, 0, 1, C - 1, 1, 0.55, RL)
    for (let i = 2; i < C; i += 7) ell(F, i, 1, 0.55, 0.55, 0.7, RL)
    for (let s = 0; s < N - 1; s++) {
      const a = strands[s].x,
        b = strands[s + 1].x
      for (let k = 0; k <= 7; k++) {
        const f = k / 7
        ell(
          F,
          a + (b - a) * f,
          2 + 3.4 * Math.sin(Math.PI * f),
          0.55,
          0.6,
          0.65,
          J,
        )
      }
    }
    strands.forEach((st, si) => {
      let px = st.x,
        py = 2,
        bead = 0
      for (let k = 2; k <= st.len; k += 2, bead++) {
        const depth = k / st.len
        const sway = reduce
          ? 0
          : 1.1 * Math.sin(t * 1.05 + st.ph + k * 0.06) * Math.pow(depth, 1.3)
        let push = 0
        if (ptr) {
          const dx = (st.x - ptr.x) * CW,
            dy = 2 + k - ptr.y
          push =
            Math.sign(dx || 1) *
            5.5 *
            Math.exp(-(dx * dx) / 32) *
            Math.exp(-(dy * dy) / 160) *
            Math.pow(depth, 0.6)
        }
        const x = st.x + (sway + push) / CW,
          y = 2 + k
        seg(F, px, py, x, y, 0.3, TH)
        if ((bead + st.off) % st.every === 0 && k > 3) {
          flower(F, x, y, 1.55, 0.6, si + k, J)
          blooms.push([x, y])
        } else ell(F, x, y, 0.66, 1, 0.85, J)
        px = x
        py = y
      }
      const bloom = 1 + near(ptr, px, py, 9) * 0.35
      flower(F, px, py + 1.8, 2.2 * bloom, 0.62, st.ph, st.rose ? RO : J)
      blooms.push([px, py + 1.8])
      seg(
        F,
        px,
        py + 3.2,
        px,
        Math.min(R - 1, py + 5.5),
        0.3,
        st.rose ? RO : TH,
      )
    })

    // particles
    if (!reduce) {
      if (rng() < dt * 5.5 && blooms.length) {
        const [x, y] = blooms[Math.floor(rng() * blooms.length)]
        spawnPetal(x, y)
      }
      if (rng() < dt * 4 && blooms.length) {
        const [x, y] = blooms[Math.floor(rng() * blooms.length)]
        spawnSpark(x, y)
      }
      parts.forEach((p) => {
        p.life += dt
        if (p.kind === 'p') {
          p.vx *= Math.pow(0.25, dt)
          p.x += ((p.vx + Math.sin(t * 2 + p.ph) * 1.6) * dt) / CW
          p.y += p.vy * dt
        } else
          p.ch = p.life < p.max * 0.3 ? '+' : p.life < p.max * 0.65 ? '*' : '.'
      })
      parts = parts
        .filter((p) => p.y < R && p.x > -2 && p.x < C + 2 && p.life < p.max)
        .slice(-90)
    }

    // compose characters and colour runs
    const ch = new Array<string>(C * R)
    const cl = new Uint8Array(C * R)
    for (let q = 0; q < C * R; q++) {
      const d = F.d[q] * (0.86 + grain[q] * 0.28)
      if (d < 0.07) {
        ch[q] = ' '
        cl[q] = 0
      } else {
        ch[q] =
          RAMP[
            Math.min(
              RAMP.length - 1,
              1 + Math.floor(Math.min(1, d) * (RAMP.length - 1.001)),
            )
          ]
        cl[q] = F.c[q]
      }
    }
    parts.forEach((p) => {
      const i = Math.round(p.x),
        j = Math.round(p.y)
      if (i < 0 || i >= C || j < 0 || j >= R) return
      const q = j * C + i
      if (p.kind === 's' || F.d[q] < 0.3) {
        ch[q] = p.ch
        cl[q] = p.col
      }
    })
    // every glyph comes from RAMP or PETALS, none of which needs HTML escaping
    let html = ''
    for (let j = 0; j < R; j++) {
      let run = '',
        rc = -1
      const flush = () => {
        if (run) html += rc > 0 ? `<span class="${CLS[rc]}">${run}</span>` : run
        run = ''
      }
      for (let i = 0; i < C; i++) {
        const q = j * C + i,
          c = ch[q] === ' ' ? 0 : cl[q]
        if (c !== rc) {
          flush()
          rc = c
        }
        run += ch[q]
      }
      flush()
      html += '\n'
    }
    return html
  }

  let ptr: Pointer | null = null
  let lastPtr: Pointer | null = null
  let raf = 0,
    last = 0,
    prev = performance.now(),
    visible = false
  const t0 = performance.now()
  const render = (now: number) => {
    raf = 0
    const dt = Math.min(0.25, (now - prev) / 1000)
    prev = now
    pre.innerHTML = draw((now - t0) / 1000, dt, ptr)
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(render)
  }
  render(performance.now())
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
  }).observe(pre)
  if (!reduce) {
    const loop = (now: number) => {
      if (visible && now - last > 90) {
        last = now
        render(now)
      } else if (!visible) prev = now
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
  pre.addEventListener('pointermove', (e) => {
    const r = pre.getBoundingClientRect()
    ptr = {
      x: ((e.clientX - r.left) / r.width) * C,
      y: ((e.clientY - r.top) / r.height) * R,
    }
    if (
      !reduce &&
      lastPtr &&
      Math.hypot((ptr.x - lastPtr.x) * CW, ptr.y - lastPtr.y) > 2.5 &&
      ptr.y < R - 6
    ) {
      spawnPetal(ptr.x, ptr.y, true)
      if (rng() < 0.5) spawnSpark(ptr.x, ptr.y)
    }
    lastPtr = ptr
    kick()
  })
  pre.addEventListener('pointerleave', () => {
    ptr = null
    lastPtr = null
    kick()
  })
}
