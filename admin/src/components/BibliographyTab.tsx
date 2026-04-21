import { useState, useEffect } from 'react'
import BibliographyEditor from './BibliographyEditor.tsx'
import type { BibliographyEntry } from '../types/api.js'
import { getStoredEditorMode } from '../lib/glossaryBibliography.ts'

interface BibliographyTabProps {
  entries: BibliographyEntry[]
  onChange: (entries: BibliographyEntry[]) => void
}

export default function BibliographyTab({
  entries,
  onChange,
}: BibliographyTabProps) {
  // Initialize with stored preference
  const [editorMode, setEditorMode] = useState<'form' | 'markdown'>(() =>
    getStoredEditorMode('bibliography'),
  )

  return (
    <div className="h-full overflow-y-auto p-4">
      <BibliographyEditor
        entries={entries}
        onChange={onChange}
        editorMode={editorMode}
        onEditorModeChange={setEditorMode}
      />
    </div>
  )
}
