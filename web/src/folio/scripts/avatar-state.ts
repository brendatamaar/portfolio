// Pure expression transitions. DOM, animation and timers live in avatar.ts.
export const moods = [
  'neutral',
  'attentive',
  'surprised',
  'excited',
  'happy',
  'laughing',
  'angry',
  'sad',
  'scared',
  'suspicious',
  'confused',
  'curious',
  'proud',
  'shy',
  'unimpressed',
  'sleepy',
] as const
export type Mood = (typeof moods)[number]
type Progress = { generation: number; nextClick: number }
export type State = Progress &
  (
    | { tag: 'automatic'; mood: Mood }
    | { tag: 'temporary'; source: 'click' | 'idle'; mood: Mood }
  )
export type Input =
  | { tag: 'attention'; near: boolean }
  | { tag: 'hover' }
  | { tag: 'leave' }
  | { tag: 'select' }
  | { tag: 'idle'; mood: Mood }
  | { tag: 'expired'; generation: number }
  | { tag: 'reset' }
export type Command =
  | { tag: 'render'; mood: Mood }
  | { tag: 'schedule-reset'; after: number; generation: number }
  | { tag: 'cancel-reset' }
export const initial: State = {
  tag: 'automatic',
  mood: 'neutral',
  generation: 0,
  nextClick: 1,
}

export function step(state: State, input: Input): [State, Command[]] {
  let next: State = state
  const commands: Command[] = []
  const automatic = (mood: Mood): State => ({
    tag: 'automatic',
    mood,
    generation: state.generation,
    nextClick: state.nextClick,
  })
  switch (input.tag) {
    case 'select':
      next = {
        tag: 'temporary',
        source: 'click',
        mood: moods[state.nextClick],
        generation: state.generation + 1,
        nextClick: (state.nextClick + 1) % moods.length,
      }
      commands.push({
        tag: 'schedule-reset',
        after: 2000,
        generation: next.generation,
      })
      break
    case 'idle':
      if (state.tag !== 'automatic') break
      next = {
        ...state,
        tag: 'temporary',
        source: 'idle',
        mood: input.mood,
        generation: state.generation + 1,
      }
      commands.push({
        tag: 'schedule-reset',
        after: 5200,
        generation: next.generation,
      })
      break
    case 'expired':
      if (state.tag === 'temporary' && state.generation === input.generation)
        next = automatic('neutral')
      break
    case 'attention':
      if (state.tag === 'temporary' && state.source === 'click') break
      if (state.tag === 'automatic' && state.mood === 'happy') break
      next = automatic(input.near ? 'curious' : 'neutral')
      break
    case 'hover':
      if (state.tag !== 'temporary' || state.source !== 'click')
        next = automatic('happy')
      break
    case 'leave':
      if (state.tag !== 'temporary' || state.source !== 'click')
        next = automatic('neutral')
      break
    case 'reset':
      next = automatic('neutral')
      break
  }
  if (state.tag === 'temporary' && next.tag === 'automatic')
    commands.push({ tag: 'cancel-reset' })
  if (next.mood !== state.mood)
    commands.push({ tag: 'render', mood: next.mood })
  return [next, commands]
}
export function run(state: State, inputs: readonly Input[]): State {
  return inputs.reduce((current, input) => step(current, input)[0], state)
}
