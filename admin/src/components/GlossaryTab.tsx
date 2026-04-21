import GlossaryEditor from './GlossaryEditor.tsx'
import type { GlossaryEntry } from '../types/api.js'

interface GlossaryTabProps {
  entries: GlossaryEntry[]
  onChange: (entries: GlossaryEntry[]) => void
}

export default function GlossaryTab({ entries, onChange }: GlossaryTabProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <GlossaryEditor entries={entries} onChange={onChange} />
    </div>
  )
}
