export const WIDTH = 704
export const HEIGHT = 320
export const CELL = 8
export const COLS = WIDTH / CELL + 1
export const ROWS = HEIGHT / CELL + 1
export const TIMESTEP = 1 / 60
export const KOI_RIPPLE_LIFETIME = 1.18
export const CLICK_RIPPLE_LIFETIME = 0.55
const KOI_RIPPLE_INTERVAL = 1.5

export interface Point {
  x: number
  y: number
}

export interface Ripple extends Point {
  strength: number
}

interface Splash extends Point {
  fish: number | null
}

interface KoiRipple extends Point {
  bornAt: number
  size: number
}

interface ClickRipple extends Point {
  bornAt: number
}

export interface Koi extends Point {
  angle: number
  turn: number
  speed: number
  size: number
  phase: number
  pattern: number
  escape: { angle: number; strength: number } | null
  passing: {
    fish: number
    side: number
    approach: number
    steer: number
    yield: number
  } | null
}

export interface Pad extends Point {
  radius: number
  angle: number
  tilt: number
  velocity: number
  form: 'round' | 'broad' | 'young'
  bloom?: 'rose' | 'cream' | 'bud'
}

export interface Pond {
  time: number
  fish: Koi[]
  koiRipple: KoiRipple | null
  clickRipples: ClickRipple[]
  nextKoiRipple: { fish: number; readyAt: number }
  pads: Pad[]
  surface: Float32Array
  previous: Float32Array
}

export interface Tick {
  pointer: Point | null
  ripples: Ripple[]
  clicks: Splash[]
}

export const clickRippleRadius = (age: number) => 5 + 73 * age

export function pondOutline(x: number, y: number) {
  return (
    Math.pow(Math.abs((x - WIDTH / 2) / (WIDTH * 0.49)), 3.2) +
    Math.pow(Math.abs((y - HEIGHT / 2) / (HEIGHT * 0.47)), 3.2)
  )
}

const wet = Uint8Array.from({ length: COLS * ROWS }, (_, i) =>
  Number(pondOutline((i % COLS) * CELL, Math.floor(i / COLS) * CELL) <= 1),
)

export function createPond(): Pond {
  return {
    time: 0,
    fish: [
      { x: 207, y: 112, angle: -0.27, speed: 42, size: 1.15, phase: 0.7 },
      { x: 385, y: 202, angle: 2.83, speed: 37, size: 1.08, phase: 2.3 },
      { x: 532, y: 117, angle: 2.22, speed: 48, size: 0.9, phase: 1.2 },
      { x: 557, y: 244, angle: -0.44, speed: 35, size: 0.76, phase: 3.5 },
    ].map((fish, pattern) => ({
      ...fish,
      pattern,
      turn: 0,
      escape: null,
      passing: null,
    })),
    koiRipple: null,
    clickRipples: [],
    nextKoiRipple: { fish: 0, readyAt: 0 },
    pads: (
      [
        { x: 57, y: 70, radius: 34, angle: 0.46, form: 'round', bloom: 'rose' },
        { x: 111, y: 40, radius: 21, angle: 1.77, form: 'broad' },
        { x: 31, y: 115, radius: 18, angle: 0.25, form: 'young' },
        { x: 152, y: 30, radius: 12, angle: 2.6, form: 'round' },
        {
          x: 625,
          y: 242,
          radius: 21,
          angle: -2.2,
          form: 'young',
          bloom: 'bud',
        },
        {
          x: 665,
          y: 267,
          radius: 34,
          angle: -2.63,
          form: 'broad',
          bloom: 'cream',
        },
        { x: 613, y: 284, radius: 19, angle: -1.8, form: 'round' },
        { x: 677, y: 220, radius: 12, angle: -2.05, form: 'young' },
      ] satisfies Omit<Pad, 'tilt' | 'velocity'>[]
    ).map((pad) => ({ ...pad, tilt: 0, velocity: 0 })),
    surface: new Float32Array(COLS * ROWS),
    previous: new Float32Array(COLS * ROWS),
  }
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value))

const angleDelta = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from))

export function sway(fish: Koi, distance: number) {
  return (
    (Math.sin(fish.phase - distance * 0.065) * 12 + fish.turn * 4) *
    (distance / 65) ** 2
  )
}

export function koiFins(fish: Koi) {
  const cos = Math.cos(fish.angle)
  const sin = Math.sin(fish.angle)
  const tailTurn = -Math.atan2(sway(fish, 66) - sway(fish, 59), 7)
  const fins: [number, number, number, number, number, number][] = []
  const add = (
    distance: number,
    offset: number,
    length: number,
    width: number,
    turn: number,
    density: number,
  ) => {
    const along = (22 - distance) * fish.size
    const across = (sway(fish, Math.min(66, distance)) + offset) * fish.size
    fins.push([
      fish.x + cos * along - sin * across,
      fish.y + sin * along + cos * across,
      length * fish.size,
      width * fish.size,
      fish.angle + turn,
      density,
    ])
  }
  for (const side of [-1, 1]) {
    add(
      34,
      side * 12,
      15,
      6,
      -side * 0.56 + Math.sin(fish.phase - side) * 0.2,
      0.49,
    )
    add(76, side * 5, 14, 4.7, tailTurn - side * 0.47, 0.68)
  }
  return fins
}

function fishOutline(fish: Koi) {
  let outline = 0
  const box = (
    x: number,
    y: number,
    angle: number,
    left: number,
    right: number,
    halfWidth: number,
  ) => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    for (const along of [left, right]) {
      for (const across of [-halfWidth, halfWidth]) {
        outline = Math.max(
          outline,
          pondOutline(
            x + cos * along - sin * across,
            y + sin * along + cos * across,
          ),
        )
      }
    }
  }
  const width = 12 + Math.abs(fish.turn) * 4
  const { x, y, angle, size } = fish
  box(x, y, angle, -15 * size, 23 * size, (15 + width * 0.33) * size)
  box(x, y, angle, -45 * size, -15 * size, (9 + width * 1.06) * size)
  for (const [fx, fy, length, halfWidth, heading] of koiFins(fish)) {
    box(fx, fy, heading, -length, length, halfWidth)
  }
  return outline
}

function containFish(fish: Koi) {
  // The inset leaves room for the edges of the glyphs around the silhouette.
  if (fishOutline(fish) <= 0.9) return fish
  let low = 0
  let high = 1
  for (let i = 0; i < 9; i++) {
    const mid = (low + high) / 2
    const x = WIDTH / 2 + (fish.x - WIDTH / 2) * mid
    const y = HEIGHT / 2 + (fish.y - HEIGHT / 2) * mid
    if (fishOutline({ ...fish, x, y }) <= 0.9) low = mid
    else high = mid
  }
  return {
    ...fish,
    x: WIDTH / 2 + (fish.x - WIDTH / 2) * low,
    y: HEIGHT / 2 + (fish.y - HEIGHT / 2) * low,
  }
}

function clickTarget(click: Splash, fish: Koi[]) {
  if (click.fish !== null) return click.fish
  let closest = 80
  let target: number | null = null
  for (const koi of fish) {
    const distance = Math.hypot(koi.x - click.x, koi.y - click.y)
    if (distance >= closest) continue
    closest = distance
    target = koi.pattern
  }
  return target
}

const bodySections = [
  { offset: 9, radius: 17 },
  { offset: -17, radius: 16 },
  { offset: -42, radius: 15 },
]
const COLLISION_LOOKAHEAD = 1.25

function collisionThreat(fish: Koi, other: Koi) {
  const cos = Math.cos(fish.angle)
  const sin = Math.sin(fish.angle)
  const otherCos = Math.cos(other.angle)
  const otherSin = Math.sin(other.angle)
  const dx = other.x - fish.x
  const dy = other.y - fish.y
  if (
    Math.hypot(dx, dy) >
    110 + (fish.speed + other.speed) * COLLISION_LOOKAHEAD
  )
    return null

  const vx = otherCos * other.speed - cos * fish.speed
  const vy = otherSin * other.speed - sin * fish.speed
  const relativeSpeedSquared = vx * vx + vy * vy
  const opposing = cos * otherCos + sin * otherSin < -0.35
  let risk = 0
  let urgency = 0
  let side = 1
  for (const a of bodySections) {
    for (const b of bodySections) {
      const x =
        dx + otherCos * b.offset * other.size - cos * a.offset * fish.size
      const y =
        dy + otherSin * b.offset * other.size - sin * a.offset * fish.size
      const time = clamp(
        -(x * vx + y * vy) / Math.max(1, relativeSpeedSquared),
        0,
        COLLISION_LOOKAHEAD,
      )
      const closestX = x + vx * time
      const closestY = y + vy * time
      const clearance =
        Math.hypot(closestX, closestY) -
        (a.radius * fish.size + b.radius * other.size)
      const score =
        clamp((28 - clearance) / 40, 0, 1) *
        (1 - (time / COLLISION_LOOKAHEAD) * 0.55)
      urgency = Math.max(
        urgency,
        clamp((21 - clearance) / 34, 0, 1) *
          (1 - time / COLLISION_LOOKAHEAD) ** 2,
      )
      if (score <= risk) continue
      risk = score
      const lateral = -sin * closestX + cos * closestY
      // Both koi use their right side for an ambiguous head-on approach.
      side = opposing && Math.abs(lateral) < 24 ? 1 : lateral > 0 ? -1 : 1
    }
  }
  return risk > 0 ? { fish: other.pattern, risk, urgency, side } : null
}

function fishParts(fish: Koi) {
  const { x, y, angle, size } = fish
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const parts = [
    [8, 15],
    [22, 17],
    [37, 14],
    [51, 11],
    [63, 7],
  ].map(([distance, radius]) => {
    const along = (22 - distance) * size
    const across = sway(fish, distance) * size
    return {
      x: x + cos * along - sin * across,
      y: y + sin * along + cos * across,
      radius: radius * size,
    }
  })
  for (const [fx, fy, length, width, heading] of koiFins(fish)) {
    const radius = Math.max(width * 1.25, length * 0.46)
    for (const offset of [-0.58, 0, 0.58]) {
      parts.push({
        x: fx + Math.cos(heading) * length * offset,
        y: fy + Math.sin(heading) * length * offset,
        radius,
      })
    }
  }
  return parts
}

function separateFish(fish: Koi[]) {
  // Close contact can still happen during a burst or when several fish converge.
  const parts = fish.map(fishParts)
  const remaining = fish.map(() => 3.75)
  for (let pass = 0; pass < 4; pass++) {
    let touched = false
    for (let i = 0; i < fish.length; i++) {
      for (let j = i + 1; j < fish.length; j++) {
        const a = fish[i]
        const b = fish[j]
        if (!remaining[i] && !remaining[j]) continue
        if (Math.hypot(a.x - b.x, a.y - b.y) > 89 * (a.size + b.size)) continue
        let overlap = 0
        let dx = 0
        let dy = 0
        for (const left of parts[i]) {
          for (const right of parts[j]) {
            const x = right.x - left.x
            const y = right.y - left.y
            const radius = left.radius + right.radius
            if (x * x + y * y >= radius * radius) continue
            const distance = Math.hypot(x, y)
            if (radius - distance <= overlap) continue
            overlap = radius - distance
            dx = distance ? x / distance : -Math.sin(a.angle)
            dy = distance ? y / distance : Math.cos(a.angle)
          }
        }
        if (!overlap) continue
        touched = true
        const shift = (overlap + 0.12) * 0.46
        const leftShift = Math.min(shift, remaining[i])
        const rightShift = Math.min(shift, remaining[j])
        remaining[i] -= leftShift
        remaining[j] -= rightShift
        fish[i] = containFish({
          ...a,
          x: a.x - dx * leftShift,
          y: a.y - dy * leftShift,
        })
        fish[j] = containFish({
          ...b,
          x: b.x + dx * rightShift,
          y: b.y + dy * rightShift,
        })
        parts[i] = fishParts(fish[i])
        parts[j] = fishParts(fish[j])
      }
    }
    if (!touched) break
  }
}

function swim(
  fish: Koi,
  pond: Pond,
  pointer: Point | null,
  clicks: Splash[],
): Koi {
  let steering = 0.34 * Math.sin(pond.time * 0.9 + fish.pattern * 2.2)

  let boost = 0
  let escape =
    fish.escape && fish.escape.strength > 0.15
      ? { ...fish.escape, strength: fish.escape.strength * 0.955 }
      : null
  for (const click of clicks) {
    if (click.fish !== fish.pattern) continue
    const dx = fish.x - click.x
    const dy = fish.y - click.y
    const away =
      Math.hypot(dx, dy) > 5 ? angleDelta(fish.angle, Math.atan2(dy, dx)) : 0.6
    escape = {
      angle: fish.angle + clamp(away, -1.18, 1.18),
      strength: 5.5,
    }
    boost += 43
  }
  if (escape) {
    steering += angleDelta(fish.angle, escape.angle) * (escape.strength / 3.5)
  }

  // Look ahead with the whole silhouette before the koi reaches the bank.
  const lookAhead = 24 + fish.speed * 0.42
  const ahead = fishOutline({
    ...fish,
    x: fish.x + Math.cos(fish.angle) * lookAhead,
    y: fish.y + Math.sin(fish.angle) * lookAhead,
  })
  const inwardX = (WIDTH / 2 - fish.x) / WIDTH
  const inwardY = (HEIGHT / 2 - fish.y) / HEIGHT
  const inwardLength = Math.hypot(inwardX, inwardY) || 1

  let threat: ReturnType<typeof collisionThreat> = null
  let priority = 0
  const previousPassing = fish.passing
  for (const other of pond.fish) {
    if (other === fish) continue
    const collision = collisionThreat(fish, other)
    if (!collision) continue
    const score =
      collision.risk + (collision.fish === previousPassing?.fish ? 0.08 : 0)
    if (score > priority) {
      priority = score
      threat = collision
    }
  }
  let passing: Koi['passing'] = null
  const partner = threat?.fish ?? previousPassing?.fish
  if (partner !== undefined) {
    const cos = Math.cos(fish.angle)
    const sin = Math.sin(fish.angle)
    const inwardSide = (-sin * inwardX + cos * inwardY) / inwardLength
    const samePartner = partner === previousPassing?.fish
    let approach = samePartner ? previousPassing.approach : fish.angle
    let side = samePartner
      ? previousPassing.side
      : (threat?.side ?? previousPassing?.side ?? 1)
    // Replan from the current heading if the chosen route would lead into the bank.
    if (ahead > 0.82 && side * inwardSide < -0.45) {
      approach = fish.angle
      side = -side
    }
    const previousSteer = previousPassing?.steer ?? 0
    const previousYield = previousPassing?.yield ?? 0
    const steer =
      previousSteer + ((threat?.risk ?? 0) - previousSteer) * (7 * TIMESTEP)
    const urgency = threat?.urgency ?? 0
    const yieldAmount =
      previousYield +
      (urgency - previousYield) * (urgency > previousYield ? 9 : 4) * TIMESTEP
    if (threat || steer > 0.015 || yieldAmount > 0.015)
      passing = { fish: partner, side, approach, steer, yield: yieldAmount }
    // Aim at a sideways bypass from the approach heading. A sustained encounter
    // keeps the same destination instead of asking for another turn each frame.
    const route = approach + side * (0.45 + 0.72 * steer)
    const influence = clamp(3.2 * steer, 0, 1)
    steering +=
      clamp(angleDelta(fish.angle, route), -1.05, 1.05) * influence * 1.55
  }
  if (pointer) {
    const dx = fish.x - pointer.x
    const dy = fish.y - pointer.y
    const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 94)
    steering +=
      clamp(angleDelta(fish.angle, Math.atan2(dy, dx)), -0.65, 0.65) * proximity
  }

  const bank = clamp((ahead - 0.4) / 0.7, 0, 1)
  const inward = angleDelta(fish.angle, Math.atan2(inwardY, inwardX))
  const bankSide =
    Math.abs(inward) > 2.7 && Math.abs(fish.turn) > 0.1
      ? Math.sign(fish.turn)
      : Math.sign(inward)
  const bankSteer = bankSide * Math.min(1.12, Math.abs(inward))
  steering = steering * (1 - bank) + bankSteer * bank
  const turnLimit = escape || bank > 0.7 ? 3.25 : 2.75
  const targetTurn = clamp(steering * 3.1, -turnLimit, turnLimit)
  const angularAcceleration = clamp((targetTurn - fish.turn) * 7, -11, 11)
  const turn = fish.turn + angularAcceleration * TIMESTEP
  const angle = fish.angle + turn * TIMESTEP
  const cruise = 40 + 6 * Math.sin(pond.time * 1.1 + fish.pattern)
  const speed = Math.min(
    155,
    fish.speed + (cruise - fish.speed) * (2.1 * TIMESTEP) + boost,
  )
  const travel =
    speed * (1 - Math.max((passing?.yield ?? 0) * 0.63, bank * 0.32))

  return containFish({
    ...fish,
    x: fish.x + Math.cos(angle) * travel * TIMESTEP,
    y: fish.y + Math.sin(angle) * travel * TIMESTEP,
    angle,
    turn,
    speed,
    escape,
    passing,
    phase: fish.phase + (4 + travel * 0.085) * TIMESTEP,
  })
}

function sample(surface: Float32Array, x: number, y: number) {
  const col = clamp(Math.round(x / CELL), 0, COLS - 1)
  const row = clamp(Math.round(y / CELL), 0, ROWS - 1)
  return surface[row * COLS + col]
}

function floatPad(
  pad: Pad,
  surface: Float32Array,
  clicks: ClickRipple[],
  time: number,
): Pad {
  const slope =
    sample(surface, pad.x + CELL, pad.y) - sample(surface, pad.x - CELL, pad.y)
  let push = 0
  for (const click of clicks) {
    const age = time - click.bornAt
    const distance = Math.hypot(pad.x - click.x, pad.y - click.y)
    const impact = Math.max(
      0,
      1 - Math.abs(distance - clickRippleRadius(age)) / 12,
    )
    push +=
      impact *
      (1 - age / CLICK_RIPPLE_LIFETIME) *
      Math.sign(pad.x - click.x) *
      10
  }
  const velocity =
    pad.velocity +
    (slope * 28 + push - pad.tilt * 26 - pad.velocity * 6) * TIMESTEP
  return { ...pad, tilt: pad.tilt + velocity * TIMESTEP, velocity }
}

function disturb(surface: Float32Array, { x, y, strength }: Ripple) {
  if (pondOutline(x, y) > 1) return
  const col = Math.round(x / CELL)
  const row = Math.round(y / CELL)
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (col + dx < 0 || col + dx >= COLS || row + dy < 0 || row + dy >= ROWS)
        continue
      const i = (row + dy) * COLS + col + dx
      if (wet[i]) surface[i] += strength * Math.exp(-(dx * dx + dy * dy) / 2)
    }
  }
}

export function step(pond: Pond, tick: Tick): Pond {
  const time = pond.time + TIMESTEP
  const surface = new Float32Array(pond.surface.length)
  const { surface: current, previous } = pond

  // Damped 2D wave equation with a reflecting shoreline. The coefficient stays below
  // the stability limit of 0.5 for a square grid at this fixed timestep.
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col
      if (!wet[i]) continue
      const height = current[i]
      const left = wet[i - 1] ? current[i - 1] : height
      const right = wet[i + 1] ? current[i + 1] : height
      const up = wet[i - COLS] ? current[i - COLS] : height
      const down = wet[i + COLS] ? current[i + COLS] : height
      surface[i] =
        (height +
          (height - previous[i]) * 0.975 +
          0.27 * (left + right + up + down - 4 * height)) *
        0.998
    }
  }

  const clicks = tick.clicks.filter(({ x, y }) => pondOutline(x, y) <= 1)
  const clickRipples = pond.clickRipples.filter(
    ({ bornAt }) => time - bornAt < CLICK_RIPPLE_LIFETIME,
  )
  for (const { x, y } of clicks) clickRipples.push({ x, y, bornAt: time })
  const taps = clicks.map((click) => ({
    ...click,
    fish: clickTarget(click, pond.fish),
  }))

  let koiRipple =
    pond.koiRipple && time - pond.koiRipple.bornAt < KOI_RIPPLE_LIFETIME
      ? pond.koiRipple
      : null
  let nextKoiRipple = pond.nextKoiRipple
  const cycle = 2 * Math.PI
  const fish = pond.fish.map((koi) => swim(koi, pond, tick.pointer, taps))
  separateFish(fish)
  const index = nextKoiRipple.fish
  const koi = fish[index]
  if (
    koi &&
    time >= nextKoiRipple.readyAt &&
    Math.floor(koi.phase / cycle) > Math.floor(pond.fish[index].phase / cycle)
  ) {
    // Give the pond a rest after each ring, then wait for the next koi's tail stroke.
    koiRipple = { x: koi.x, y: koi.y, bornAt: time, size: koi.size }
    nextKoiRipple = {
      fish: (index + 1) % fish.length,
      readyAt: time + KOI_RIPPLE_INTERVAL,
    }
  }
  for (const ripple of tick.ripples) disturb(surface, ripple)

  return {
    time,
    fish,
    koiRipple,
    clickRipples,
    nextKoiRipple,
    surface,
    previous: current,
    pads: pond.pads.map((pad) => floatPad(pad, surface, clickRipples, time)),
  }
}
