import { useState } from 'react'
import type { GlossaryEntry } from '../types/api.js'
import EntryEditor from './EntryEditor.js'

interface GlossaryEditorProps {
  entries: GlossaryEntry[]
  onChange: (entries: GlossaryEntry[]) => void
}

export default function GlossaryEditor({
  entries,
  onChange,
}: GlossaryEditorProps) {
  const [editKey, setEditKey] = useState('')
  const [editTerm, setEditTerm] = useState('')
  const [editDefinition, setEditDefinition] = useState('')

  const renderEntry = (entry: GlossaryEntry) => (
    <>
      <div className="flex items-center gap-2">
        <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10 dark:text-white">
          {entry.key}
        </code>
        <h4 className="font-mono text-sm font-bold dark:text-white">
          {entry.term}
        </h4>
      </div>
      <p className="mt-1 pl-4 font-mono text-xs leading-relaxed text-black/60 dark:text-white/60">
        {entry.definition}
      </p>
    </>
  )

  const renderEditForm = (
    entry: GlossaryEntry | null,
    onSave: (entry: GlossaryEntry) => void,
    onCancel: () => void,
  ) => {
    // Initialize fields when entry changes (for editing existing)
    // For new entries, entry exists but key is empty
    const isExistingEntry = entry?.key && entry.key.length > 0

    if (entry && isExistingEntry && editKey === '' && editTerm === '') {
      setEditKey(entry.key)
      setEditTerm(entry.term)
      setEditDefinition(entry.definition)
    }

    const handleSave = () => {
      onSave({
        key: editKey.trim(),
        term: editTerm.trim(),
        definition: editDefinition.trim(),
      })
      setEditKey('')
      setEditTerm('')
      setEditDefinition('')
    }

    const handleCancel = () => {
      setEditKey('')
      setEditTerm('')
      setEditDefinition('')
      onCancel()
    }

    const isValid = editKey.trim() && editTerm.trim() && editDefinition.trim()

    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Key
          </label>
          <input
            type="text"
            value={editKey}
            onChange={(e) => setEditKey(e.target.value)}
            className="w-full border-b border-black/20 bg-transparent pb-1 font-mono text-sm outline-none focus:border-black/50 dark:border-white/20 dark:text-white"
            placeholder="e.g., startViewTransition"
            autoFocus
          />
          <p className="mt-1 font-mono text-[9px] text-black/30 dark:text-white/30">
            Use in content: [gloss:{editKey || 'key'}]
          </p>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Term
          </label>
          <input
            type="text"
            value={editTerm}
            onChange={(e) => setEditTerm(e.target.value)}
            className="w-full border-b border-black/20 bg-transparent pb-1 font-mono text-sm outline-none focus:border-black/50 dark:border-white/20 dark:text-white"
            placeholder="e.g., document.startViewTransition()"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Definition
          </label>
          <textarea
            value={editDefinition}
            onChange={(e) => setEditDefinition(e.target.value)}
            rows={3}
            className="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs outline-none focus:border-black/30 dark:border-white/10 dark:text-white"
            placeholder="Enter definition..."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-black px-3 py-1 font-mono text-[10px] tracking-widest text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="border border-black/20 px-3 py-1 font-mono text-[10px] tracking-widest text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const getEntryKey = (entry: GlossaryEntry) => entry.key

  const validateEntry = (
    entry: GlossaryEntry,
    existingEntries: GlossaryEntry[],
    editingIndex: number | null,
  ): string | null => {
    const trimmedKey = entry.key?.trim() || ''
    if (!trimmedKey) {
      return 'Key is required'
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
      return 'Key must be alphanumeric with hyphens/underscores only'
    }
    const existingIndex = existingEntries.findIndex(
      (e, i) =>
        e.key?.toLowerCase() === trimmedKey.toLowerCase() && i !== editingIndex,
    )
    if (existingIndex !== -1) {
      return `Key "${trimmedKey}" already exists`
    }
    return null
  }

  return (
    <EntryEditor
      entries={entries}
      onChange={onChange}
      entryLabel="Term"
      renderEntry={renderEntry}
      renderEditForm={renderEditForm}
      getEntryKey={getEntryKey}
      validateEntry={validateEntry}
    />
  )
}
