import { useState } from 'react'
import type { BibliographyEntry } from '../types/api.js'
import EntryEditor from './EntryEditor.js'

const SOURCE_TYPES = [
  { value: 'web', label: 'Web', icon: '🌐' },
  { value: 'docs', label: 'Docs', icon: '📖' },
  { value: 'journal', label: 'Journal', icon: '📄' },
  { value: 'article', label: 'Article', icon: '📰' },
  { value: 'book', label: 'Book', icon: '📚' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'podcast', label: 'Podcast', icon: '🎙' },
  { value: 'repo', label: 'Repository', icon: '💾' },
  { value: 'other', label: 'Other', icon: '·' },
] as const

interface BibliographyEditorProps {
  entries: BibliographyEntry[]
  onChange: (entries: BibliographyEntry[]) => void
}

export default function BibliographyEditor({
  entries,
  onChange,
}: BibliographyEditorProps) {
  const [editKey, setEditKey] = useState('')
  const [editText, setEditText] = useState('')
  const [editSourceType, setEditSourceType] =
    useState<BibliographyEntry['sourceType']>('web')

  const renderEntry = (entry: BibliographyEntry, index: number) => (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-black/40 dark:text-white/40">
        [{index + 1}]
      </span>
      <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10 dark:text-white">
        {entry.key}
      </code>
      <span className="text-xs opacity-60">
        {SOURCE_TYPES.find((t) => t.value === entry.sourceType)?.icon}
      </span>
      <p className="mt-1 pl-6 font-mono text-xs leading-relaxed text-black/60 dark:text-white/60">
        {entry.text}
      </p>
    </div>
  )

  const renderEditForm = (
    entry: BibliographyEntry | null,
    onSave: (entry: BibliographyEntry) => void,
    onCancel: () => void,
  ) => {
    // Initialize fields when entry changes (for editing existing)
    // For new entries, entry exists but key is empty
    const isExistingEntry = entry?.key && entry.key.length > 0

    if (entry && isExistingEntry && editKey === '' && editText === '') {
      setEditKey(entry.key)
      setEditText(entry.text)
      setEditSourceType(entry.sourceType)
    }

    const handleSave = () => {
      onSave({
        key: editKey.trim(),
        text: editText.trim(),
        sourceType: editSourceType,
      })
      setEditKey('')
      setEditText('')
      setEditSourceType('web')
    }

    const handleCancel = () => {
      setEditKey('')
      setEditText('')
      setEditSourceType('web')
      onCancel()
    }

    const isValid = editKey.trim() && editText.trim()

    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Citation Key
          </label>
          <input
            type="text"
            value={editKey}
            onChange={(e) => setEditKey(e.target.value)}
            className="w-full border-b border-black/20 bg-transparent pb-1 font-mono text-sm outline-none focus:border-black/50 dark:border-white/20 dark:text-white"
            placeholder="e.g., react-docs"
            autoFocus
          />
          <p className="mt-1 font-mono text-[9px] text-black/30 dark:text-white/30">
            Use in text: [cite:{editKey || 'key'}]
          </p>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Source Type
          </label>
          <select
            value={editSourceType}
            onChange={(e) =>
              setEditSourceType(
                e.target.value as BibliographyEntry['sourceType'],
              )
            }
            className="w-full border border-black/10 bg-transparent p-2 font-mono text-xs outline-none focus:border-black/30 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
          >
            {SOURCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Citation Text
          </label>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs outline-none focus:border-black/30 dark:border-white/10 dark:text-white"
            placeholder="e.g., React Documentation. Meta Open Source, 2024. https://react.dev"
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

  const getEntryKey = (entry: BibliographyEntry) => entry.key

  const validateEntry = (
    entry: BibliographyEntry,
    existingEntries: BibliographyEntry[],
    editingIndex: number | null,
  ): string | null => {
    const trimmedKey = entry.key.trim()
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
      return 'Key must be alphanumeric with hyphens/underscores only'
    }
    const existingIndex = existingEntries.findIndex(
      (e, i) => e.key === trimmedKey && i !== editingIndex,
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
      entryLabel="Entry"
      renderEntry={renderEntry}
      renderEditForm={renderEditForm}
      getEntryKey={getEntryKey}
      validateEntry={validateEntry}
    />
  )
}
