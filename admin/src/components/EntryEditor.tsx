import { useState } from 'react'
import ConfirmModal from './ConfirmModal.js'

export interface EntryEditorProps<T> {
  entries: T[]
  onChange: (entries: T[]) => void
  entryLabel: string
  renderEntry: (entry: T, index: number) => React.ReactNode
  renderEditForm: (
    entry: T | null,
    onSave: (entry: T) => void,
    onCancel: () => void,
  ) => React.ReactNode
  getEntryKey: (entry: T) => string
  validateEntry?: (
    entry: T,
    existingEntries: T[],
    editingIndex: number | null,
  ) => string | null
}

export default function EntryEditor<T>({
  entries,
  onChange,
  entryLabel,
  renderEntry,
  renderEditForm,
  getEntryKey,
  validateEntry,
}: EntryEditorProps<T>) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draftEntry, setDraftEntry] = useState<T | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const handleAdd = () => {
    setEditingIndex(entries.length)
    setDraftEntry({} as T)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setDraftEntry({ ...entries[index] })
  }

  const handleSave = (entry: T) => {
    if (validateEntry) {
      const error = validateEntry(entry, entries, editingIndex)
      if (error) {
        alert(error)
        return
      }
    }

    const updated = [...entries]
    if (editingIndex !== null && editingIndex < entries.length) {
      updated[editingIndex] = entry
    } else {
      updated.push(entry)
    }
    onChange(updated)
    setEditingIndex(null)
    setDraftEntry(null)
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setDraftEntry(null)
  }

  const handleDelete = (index: number) => {
    setDeleteIndex(index)
  }

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      onChange(entries.filter((_, i) => i !== deleteIndex))
      if (editingIndex === deleteIndex) {
        setEditingIndex(null)
        setDraftEntry(null)
      }
      setDeleteIndex(null)
    }
  }

  const cancelDelete = () => {
    setDeleteIndex(null)
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === entries.length - 1) return

    const updated = [...entries]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    onChange(updated)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-xs tracking-widest text-black/60 uppercase dark:text-white/60">
          {entryLabel}s ({entries.length})
        </h3>
        <button
          onClick={handleAdd}
          className="bg-[#FFE600] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-black uppercase transition-colors hover:bg-yellow-400"
        >
          + Add {entryLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {/* Show edit form for new entry (adding) */}
          {editingIndex === entries.length && draftEntry && (
            <div className="border border-black/10 p-3 dark:border-white/10">
              {renderEditForm(draftEntry, handleSave, handleCancel)}
            </div>
          )}

          {/* Show existing entries */}
          {entries.length === 0 && editingIndex !== entries.length ? (
            <div className="flex h-32 items-center justify-center text-black/30 dark:text-white/30">
              <span className="font-mono text-xs">
                No {entryLabel.toLowerCase()}s yet
              </span>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div
                key={getEntryKey(entry) || index}
                className="border border-black/10 p-3 dark:border-white/10"
              >
                {editingIndex === index ? (
                  renderEditForm(draftEntry, handleSave, handleCancel)
                ) : (
                  <div>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      {renderEntry(entry, index)}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-black/30 transition-colors hover:text-black disabled:opacity-20 dark:text-white/30 dark:hover:text-white"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === entries.length - 1}
                          className="p-1 text-black/30 transition-colors hover:text-black disabled:opacity-20 dark:text-white/30 dark:hover:text-white"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-1 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="p-1 text-black/40 transition-colors hover:text-red-500 dark:text-white/40"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteIndex !== null}
        title={`Delete ${entryLabel}`}
        message={`Are you sure you want to delete this ${entryLabel.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
