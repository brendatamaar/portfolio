import { useState, useEffect } from 'react'
import GlossaryEditor from './GlossaryEditor.tsx'
import type { GlossaryEntry } from '../types/api.js'
import { getStoredEditorMode } from '../lib/glossaryBibliography.ts'

interface GlossaryTabProps {
  entries: GlossaryEntry[]
  onChange: (entries: GlossaryEntry[]) => void
}

export default function GlossaryTab({ entries, onChange }: GlossaryTabProps) {
  // Initialize with stored preference
  const [editorMode, setEditorMode] = useState<'form' | 'markdown'>(() =>
    getStoredEditorMode('glossary'),
  )

  return (
    <div className="h-full overflow-y-auto p-4">
      <GlossaryEditor
        entries={entries}
        onChange={onChange}
        editorMode={editorMode}
        onEditorModeChange={setEditorMode}
      />
    </div>
  )
}
