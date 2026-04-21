import BibliographyEditor from './BibliographyEditor.tsx'
import type { BibliographyEntry } from '../types/api.js'

interface BibliographyTabProps {
  entries: BibliographyEntry[]
  onChange: (entries: BibliographyEntry[]) => void
}

export default function BibliographyTab({
  entries,
  onChange,
}: BibliographyTabProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <BibliographyEditor entries={entries} onChange={onChange} />
    </div>
  )
}
