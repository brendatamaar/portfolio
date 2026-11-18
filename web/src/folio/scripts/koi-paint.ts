import {
  CELL,
  CLICK_RIPPLE_LIFETIME,
  clickRippleRadius,
  COLS,
  HEIGHT,
  KOI_RIPPLE_LIFETIME,
  koiFins,
  pondOutline,
  ROWS,
  sway,
  WIDTH,
  type Koi,
  type Pad,
  type Point,
  type Pond,
} from './koi-physics'

// The same light-to-heavy Aksara Jawa ramp as the original homepage art.
export const JAVANESE_GLYPHS =
  '\uA9C8\uA9DE\uA9D0\uA9D6\uA992\uA9AB\uA9AE\uA9A4\uA99B\uA998'
export const JAVANESE_FONT = '700 7px "Noto Sans Javanese"'
const ASCII_GLYPHS = '.:-+*ox%#@'
const ASCII_FONT = '700 7px ui-monospace, Menlo, Consolas, monospace'
const CELL_WIDTH = 5.5
const CELL_HEIGHT = 5
const COLUMNS = WIDTH / CELL_WIDTH
const LINES = HEIGHT / CELL_HEIGHT

enum Ink {
  Water,
  Foam,
  Pad,
  Vein,
  Ivory,
  Red,
  Soot,
  Gold,
  Amber,
  Silver,
  Jade,
  Olive,
  Rose,
  Blush,
  PetalCream,
}

const DARK = [
  '#56858b',
  '#a4e1dc',
  '#8ab77b',
  '#b5cc93',
  '#f4e6ca',
  '#f4795e',
  '#81849a',
  '#ffd184',
  '#e99a52',
  '#d0e3dc',
  '#83b8ac',
  '#a3ac68',
  '#e77fa6',
  '#ffbfcf',
  '#fff1d9',
]
const LIGHT = [
  '#416e78',
  '#216f7a',
  '#4c7848',
  '#698042',
  '#877253',
  '#af432e',
  '#505063',
  '#a56a22',
  '#ae631f',
  '#557d79',
  '#37695d',
  '#69743c',
  '#a14670',
  '#be607f',
  '#946954',
]

const PAD_FORMS = {
  round: { notch: 0.3, veins: 9, ink: Ink.Pad },
  broad: { notch: 0.45, veins: 7, ink: Ink.Olive },
  young: { notch: 0.17, veins: 5, ink: Ink.Jade },
}

const PATTERNS: {
  body: Ink
  fin: Ink
  marks: [number, number, number, number, Ink][]
}[] = [
  {
    body: Ink.Ivory,
    fin: Ink.Ivory,
    marks: [
      [5, 0, 6, 8, Ink.Red],
      [23, -3, 10, 8, Ink.Red],
      [42, 3, 8, 7, Ink.Red],
      [55, 0, 5, 4, Ink.Red],
    ],
  },
  {
    body: Ink.Ivory,
    fin: Ink.Ivory,
    marks: [
      [6, -2, 7, 7, Ink.Red],
      [21, 4, 8, 8, Ink.Soot],
      [36, -2, 9, 8, Ink.Red],
      [52, 2, 6, 6, Ink.Soot],
    ],
  },
  {
    body: Ink.Gold,
    fin: Ink.Amber,
    marks: [
      [19, 2, 9, 10, Ink.Amber],
      [38, -3, 8, 7, Ink.Amber],
    ],
  },
  {
    body: Ink.Silver,
    fin: Ink.Jade,
    marks: [
      [11, 4, 7, 8, Ink.Jade],
      [30, -4, 9, 7, Ink.Jade],
      [49, 1, 8, 5, Ink.Jade],
    ],
  },
]

const stations = [0, 3, 9, 18, 27, 37, 48, 57, 66]
const widths = [0, 7, 11, 14, 13, 10, 7, 4, 1.5]
const bodyWidth = Array.from({ length: 67 }, (_, distance) => {
  const i = stations.findIndex((station) => station > distance)
  if (i < 0) return widths[widths.length - 1]
  const t = (distance - stations[i - 1]) / (stations[i] - stations[i - 1])
  return widths[i - 1] + (widths[i] - widths[i - 1]) * t
})

export function createPondPainter(ctx: CanvasRenderingContext2D) {
  const density = new Float32Array(COLUMNS * LINES)
  const color = new Uint8Array(density.length)
  const fishAtCell = new Int8Array(density.length).fill(-1)
  const glyphCenters = new Map<string, number[]>()
  let seed = 37
  const grain = Array.from(
    density,
    () => (seed = (seed * 16807) % 2147483647) / 2147483647,
  )
  const bed = grain.map((_, i) =>
    pondOutline(
      ((i % COLUMNS) + 0.5) * CELL_WIDTH,
      (Math.floor(i / COLUMNS) + 0.5) * CELL_HEIGHT,
    ),
  )
  const wetGlyph = bed.map((_, i) => {
    const x = ((i % COLUMNS) + 0.5) * CELL_WIDTH
    const y = (Math.floor(i / COLUMNS) + 0.5) * CELL_HEIGHT
    // Leave room for the ink around the glyph's center at the shoreline.
    return (
      pondOutline(
        x + (Math.sign(x - WIDTH / 2) * CELL_WIDTH) / 2,
        y + (Math.sign(y - HEIGHT / 2) * CELL_HEIGHT) / 2,
      ) <= 1
    )
  })

  function put(i: number, value: number, ink: Ink, fish = -1) {
    density[i] = value
    color[i] = ink
    fishAtCell[i] = fish
  }

  // Sample each shape at the center of its character cell. No raster art is drawn beneath the grid.
  function cells(
    x: number,
    y: number,
    radius: number,
    sample: (i: number, dx: number, dy: number) => void,
  ) {
    const x0 = Math.max(0, Math.floor((x - radius) / CELL_WIDTH))
    const x1 = Math.min(COLUMNS - 1, Math.floor((x + radius) / CELL_WIDTH))
    const y0 = Math.max(0, Math.floor((y - radius) / CELL_HEIGHT))
    const y1 = Math.min(LINES - 1, Math.floor((y + radius) / CELL_HEIGHT))
    for (let row = y0; row <= y1; row++) {
      const dy = (row + 0.5) * CELL_HEIGHT - y
      for (let col = x0; col <= x1; col++) {
        sample(row * COLUMNS + col, (col + 0.5) * CELL_WIDTH - x, dy)
      }
    }
  }

  function oval(
    x: number,
    y: number,
    rx: number,
    ry: number,
    angle: number,
    ink: Ink,
    strength: number,
    fish = -1,
  ) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    cells(x, y, Math.max(rx, ry), (i, dx, dy) => {
      const distance =
        ((dx * cos + dy * sin) / rx) ** 2 + ((dy * cos - dx * sin) / ry) ** 2
      if (distance < 1)
        put(i, Math.min(1, (1 - distance) * 3) * strength, ink, fish)
    })
  }

  function koi(fish: Koi) {
    const { x, y, size, angle } = fish
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const pattern = PATTERNS[fish.pattern]

    for (const [fx, fy, length, width, heading, density] of koiFins(fish)) {
      oval(fx, fy, length, width, heading, pattern.fin, density, fish.pattern)
    }

    cells(x, y, 49 * size, (i, dx, dy) => {
      const distance = 22 - (dx * cos + dy * sin) / size
      const station = Math.round(distance)
      if (station < 0 || station >= bodyWidth.length) return
      const across = (dy * cos - dx * sin) / size - sway(fish, distance)
      const edge = bodyWidth[station] - Math.abs(across)
      if (edge < -1.1 || (station === 0 && distance < 0)) return

      let ink = pattern.body
      let strength = 0.88
      for (const [
        longitudinal,
        lateral,
        length,
        width,
        markInk,
      ] of pattern.marks) {
        if (
          ((distance - longitudinal) / length) ** 2 +
            ((across - lateral) / width) ** 2 <
          1
        ) {
          ink = markInk
          strength = 1
          break
        }
      }
      if ((distance - 8) ** 2 + (Math.abs(across) - 7.6) ** 2 < 6) {
        ink = Ink.Soot
        strength = 1
      }
      put(i, Math.min(strength, (edge + 1.7) / 4.8), ink, fish.pattern)
    })
  }

  function lily(pad: Pad, time: number) {
    const angle =
      pad.angle + pad.tilt * 0.35 + Math.sin(time * 0.9 + pad.angle) * 0.035
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const form = PAD_FORMS[pad.form]
    cells(pad.x, pad.y, pad.radius, (i, dx, dy) => {
      const x = dx * cos + dy * sin
      const y = dy * cos - dx * sin
      const radius = Math.hypot(dx, dy) / pad.radius
      if (radius >= 1 || (x > 1 && Math.abs(y) < form.notch * x)) return
      const vein =
        Math.cos(form.veins * Math.atan2(y, x)) > 0.88 && radius < 0.89
      put(
        i,
        Math.min(0.77 + 0.12 * Number(vein), (1 - radius) * 4.3),
        vein ? Ink.Vein : form.ink,
      )
    })

    if (!pad.bloom) return
    const x = pad.x - cos * pad.radius * 0.25
    const y = pad.y - sin * pad.radius * 0.25 - 4
    if (pad.bloom === 'bud') {
      oval(x, y, 8.5, 8.5, 0, Ink.Rose, 0.92)
      oval(x - 1.5, y - 1.5, 5.2, 5.2, 0, Ink.Blush, 0.88)
      return
    }

    const rose = pad.bloom === 'rose'
    const petals = rose ? 7 : 5
    const size = rose ? 1.16 : 0.92
    for (let i = 0; i < petals; i++) {
      const direction = angle + (2 * Math.PI * i) / petals
      const reach = 9 * size
      oval(
        x + Math.cos(direction) * reach,
        y + Math.sin(direction) * reach,
        9.5 * size,
        6.6 * size,
        direction,
        rose ? Ink.Rose : Ink.PetalCream,
        0.94,
      )
    }
    for (let i = 0; i < petals; i++) {
      const direction = angle + (2 * Math.PI * (i + 0.5)) / petals
      const reach = 5.5 * size
      oval(
        x + Math.cos(direction) * reach,
        y + Math.sin(direction) * reach,
        5.8 * size,
        4.2 * size,
        direction,
        rose ? Ink.Blush : Ink.Ivory,
        0.92,
      )
    }
    oval(x, y, 4.5 * size, 4.5 * size, 0, Ink.Gold, 1)
  }

  function water(pond: Pond) {
    density.fill(0)
    for (let row = 0; row < LINES; row++) {
      const y = (row + 0.5) * CELL_HEIGHT
      const waveY = Math.min(ROWS - 2, Math.floor(y / CELL))
      const fy = y / CELL - waveY
      for (let col = 0; col < COLUMNS; col++) {
        const i = row * COLUMNS + col
        const x = (col + 0.5) * CELL_WIDTH
        const waveX = Math.min(COLS - 2, Math.floor(x / CELL))
        const fx = x / CELL - waveX
        const nw = waveY * COLS + waveX
        const a = pond.surface[nw]
        const b = pond.surface[nw + 1]
        const c = pond.surface[nw + COLS]
        const d = pond.surface[nw + COLS + 1]
        const wave =
          Math.abs((b - a) * (1 - fy) + (d - c) * fy) * 0.45 +
          Math.abs((c - a) * (1 - fx) + (d - b) * fx) * 0.65

        if (wetGlyph[i] && wave > 0.058) {
          put(
            i,
            Math.min(0.97, 0.16 + wave * 1.6),
            wave > 0.22 ? Ink.Foam : Ink.Water,
          )
          continue
        }
        if (bed[i] > 1.15) continue
        const flow =
          Math.sin(
            y * 0.13 + Math.sin(x * 0.037 + pond.time * 0.72) * 1.6 + x * 0.023,
          ) * Math.sin(x * 0.034 - y * 0.018 - pond.time * 0.5)
        const edge = Math.max(0, 1 - Math.abs(bed[i] - 0.93) * 5.5)
        const ripple = Math.max(0, (flow - 0.67) * 1.9)
        const strength = edge * 0.17 + ripple * 0.39 + grain[i] * 0.13
        if (strength > 0.165) put(i, strength, Ink.Water)
      }
    }
  }

  function koiRipple(pond: Pond) {
    if (!pond.koiRipple) return
    const { x, y, bornAt, size } = pond.koiRipple
    const age = pond.time - bornAt
    const radius = 24 * size + 61 * age
    const fade =
      Math.min(1, age / 0.12) * (1 - age / KOI_RIPPLE_LIFETIME) ** 1.35
    const width = 5
    cells(x, y, radius + width, (i, dx, dy) => {
      if (!wetGlyph[i]) return
      const offset = Math.hypot(dx, dy) - radius
      const crest = 1 - Math.abs(offset) / width
      const trailing = 1 - Math.abs(offset + 10) / width
      const strength = Math.max(crest * 0.83, trailing * 0.39) * fade
      if (strength > Math.max(0.1, density[i])) put(i, strength, Ink.Foam)
    })
  }

  function clickRipples(pond: Pond) {
    const width = 4.5
    for (const { x, y, bornAt } of pond.clickRipples) {
      const age = pond.time - bornAt
      const radius = clickRippleRadius(age)
      const fade = (1 - age / CLICK_RIPPLE_LIFETIME) ** 1.15
      cells(x, y, radius + width, (i, dx, dy) => {
        if (!wetGlyph[i]) return
        const offset = Math.abs(Math.hypot(dx, dy) - radius)
        const strength = 0.95 * (1 - offset / width) * fade
        if (strength > Math.max(0.1, density[i])) put(i, strength, Ink.Foam)
      })
    }
  }

  function paint(pond: Pond, hasJavanese: boolean, light: boolean) {
    water(pond)
    koiRipple(pond)
    clickRipples(pond)
    for (const fish of pond.fish) koi(fish)
    for (const pad of pond.pads) lily(pad, pond.time)

    const ramp = hasJavanese ? JAVANESE_GLYPHS : ASCII_GLYPHS
    const palette = light ? LIGHT : DARK
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    ctx.font = hasJavanese ? JAVANESE_FONT : ASCII_FONT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    let centers = glyphCenters.get(ramp)
    if (!centers) {
      centers = Array.from(ramp, (glyph) => {
        const metrics = ctx.measureText(glyph)
        return (
          (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) /
          2
        )
      })
      glyphCenters.set(ramp, centers)
    }

    let previousColor = -1
    for (let i = 0; i < density.length; i++) {
      const ink = density[i] * (0.88 + grain[i] * 0.24)
      if (ink < 0.1) {
        fishAtCell[i] = -1
        continue
      }
      const letter = Math.min(ramp.length - 1, Math.floor(ink * ramp.length))
      if (color[i] !== previousColor) {
        previousColor = color[i]
        ctx.fillStyle = palette[previousColor]
      }
      ctx.globalAlpha = Math.min(1, 0.32 + ink * 0.8)
      ctx.fillText(
        ramp[letter],
        ((i % COLUMNS) + 0.5) * CELL_WIDTH,
        (Math.floor(i / COLUMNS) + 0.5) * CELL_HEIGHT + centers[letter],
        CELL_WIDTH * 0.95,
      )
    }
    ctx.globalAlpha = 1
  }

  function hitKoi(point: Point, slop: number) {
    let closest = (slop + Math.hypot(CELL_WIDTH, CELL_HEIGHT) / 2) ** 2
    let hit: number | null = null
    cells(point.x, point.y, Math.sqrt(closest), (i, dx, dy) => {
      const distance = dx * dx + dy * dy
      if (fishAtCell[i] < 0 || distance > closest) return
      closest = distance
      hit = fishAtCell[i]
    })
    return hit
  }

  return { paint, hitKoi }
}
