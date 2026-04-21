import {
  useState,
  useEffect,
  useMemo,
  useDeferredValue,
  useCallback,
  useRef,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import type { BibliographyEntry } from '../types/api.js'
import EntryEditor from './EntryEditor.js'
import {
  bibliographyToMarkdown,
  bibliographyFromMarkdown,
  renderBibliographyPreview,
  renderParseErrors,
  validateBibliographyEntry,
  VALID_SOURCE_TYPES,
  getStoredEditorMode,
  setStoredEditorMode,
  type ParseResult,
  type SourceType,
} from '../lib/glossaryBibliography.ts'
import { MARKDOWN_SYNC_DEBOUNCE_MS } from '../lib/constants.ts'

const SOURCE_TYPES = [
  { value: 'web' as SourceType, label: 'Web', icon: '🌐' },
  { value: 'docs' as SourceType, label: 'Docs', icon: '📖' },
  { value: 'journal' as SourceType, label: 'Journal', icon: '📄' },
  { value: 'article' as SourceType, label: 'Article', icon: '📰' },
  { value: 'book' as SourceType, label: 'Book', icon: '📚' },
  { value: 'video' as SourceType, label: 'Video', icon: '🎬' },
  { value: 'podcast' as SourceType, label: 'Podcast', icon: '🎙' },
  { value: 'repo' as SourceType, label: 'Repository', icon: '💾' },
  { value: 'other' as SourceType, label: 'Other', icon: '·' },
] as const

interface BibliographyEditorProps {
  entries: BibliographyEntry[]
  onChange: (entries: BibliographyEntry[]) => void
  editorMode: 'form' | 'markdown'
  onEditorModeChange: (mode: 'form' | 'markdown') => void
}

export default function BibliographyEditor({
  entries,
  onChange,
  editorMode,
  onEditorModeChange,
}: BibliographyEditorProps) {
  // Local state for markdown editing
  const [markdown, setMarkdown] = useState('')
  const [parseResult, setParseResult] = useState<
    ParseResult<BibliographyEntry>
  >({
    entries: [],
    errors: [],
    isValid: true,
  })
  const [editKey, setEditKey] = useState('')
  const [editText, setEditText] = useState('')
  const [editSourceType, setEditSourceType] = useState<SourceType>('web')

  // Refs for debouncing and textarea
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync markdown when entries change (form → markdown)
  useEffect(() => {
    if (editorMode === 'markdown') {
      const newMarkdown = bibliographyToMarkdown(entries)
      setMarkdown(newMarkdown)
      setParseResult({ entries, errors: [], isValid: true })
    }
  }, [entries, editorMode])

  // Debounced sync from markdown to entries
  const debouncedSyncToEntries = useCallback(
    (newMarkdown: string) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      syncTimeoutRef.current = setTimeout(() => {
        const result = bibliographyFromMarkdown(newMarkdown)
        setParseResult(result)

        // Only update parent if valid or empty
        if (result.isValid || newMarkdown.trim() === '') {
          onChange(result.entries)
        }
      }, MARKDOWN_SYNC_DEBOUNCE_MS)
    },
    [onChange],
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // Handle markdown changes
  const handleMarkdownChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newMarkdown = e.target.value
      setMarkdown(newMarkdown)
      debouncedSyncToEntries(newMarkdown)
    },
    [debouncedSyncToEntries],
  )

  // Handle mode switch with persistence
  const handleModeChange = useCallback(
    (newMode: 'form' | 'markdown') => {
      onEditorModeChange(newMode)
      setStoredEditorMode('bibliography', newMode)
    },
    [onEditorModeChange],
  )

  // Keyboard shortcut: Ctrl/Cmd+Shift+M to toggle mode
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault()
        const newMode = editorMode === 'form' ? 'markdown' : 'form'
        handleModeChange(newMode)
      }
    },
    [editorMode, handleModeChange],
  )

  // Deferred markdown for preview performance
  const deferredMarkdown = useDeferredValue(markdown)

  // Compute preview HTML with error display
  const { previewHtml, hasErrors, errorHtml } = useMemo(() => {
    let previewEntries: BibliographyEntry[]
    let currentErrors = parseResult.errors

    if (editorMode === 'markdown') {
      const result = bibliographyFromMarkdown(deferredMarkdown)
      previewEntries = result.entries
      currentErrors = result.errors
    } else {
      previewEntries = entries
    }

    return {
      previewHtml: renderBibliographyPreview(previewEntries),
      hasErrors: currentErrors.length > 0,
      errorHtml: renderParseErrors(currentErrors),
    }
  }, [editorMode, deferredMarkdown, entries, parseResult.errors])

  // Form editing handlers
  const handleSaveEntry = useCallback(
    (onSave: (entry: BibliographyEntry) => void) => {
      const entry: BibliographyEntry = {
        key: editKey.trim(),
        text: editText.trim(),
        sourceType: editSourceType,
      }
      onSave(entry)
      setEditKey('')
      setEditText('')
      setEditSourceType('web')
    },
    [editKey, editText, editSourceType],
  )

  const handleCancelEdit = useCallback((onCancel: () => void) => {
    setEditKey('')
    setEditText('')
    setEditSourceType('web')
    onCancel()
  }, [])

  const renderEntry = useCallback(
    (entry: BibliographyEntry, index: number) => (
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
    ),
    [],
  )

  const renderEditForm = useCallback(
    (
      entry: BibliographyEntry | null,
      onSave: (entry: BibliographyEntry) => void,
      onCancel: () => void,
    ) => {
      const isExistingEntry = entry?.key && entry.key.length > 0

      if (entry && isExistingEntry && editKey === '' && editText === '') {
        setEditKey(entry.key)
        setEditText(entry.text)
        setEditSourceType(entry.sourceType)
      }

      const isValid = editKey.trim() && editText.trim()

      return (
        <div className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="bib-key"
              className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40"
            >
              Citation Key
            </label>
            <input
              id="bib-key"
              type="text"
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              className="w-full border-b border-black/20 bg-transparent pb-1 font-mono text-sm outline-none focus:border-black/50 dark:border-white/20 dark:text-white"
              placeholder="e.g., react-docs"
              autoFocus
              aria-describedby="bib-key-hint"
            />
            <p
              id="bib-key-hint"
              className="mt-1 font-mono text-[9px] text-black/30 dark:text-white/30"
            >
              Use in text: [cite:{editKey || 'key'}]
            </p>
          </div>
          <div>
            <label
              htmlFor="bib-source-type"
              className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40"
            >
              Source Type
            </label>
            <select
              id="bib-source-type"
              value={editSourceType}
              onChange={(e) => setEditSourceType(e.target.value as SourceType)}
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
            <label
              htmlFor="bib-text"
              className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40"
            >
              Citation Text
            </label>
            <textarea
              id="bib-text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              className="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs outline-none focus:border-black/30 dark:border-white/10 dark:text-white"
              placeholder="e.g., React Documentation. Meta Open Source, 2024. https://react.dev"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSaveEntry(onSave)}
              disabled={!isValid}
              className="bg-black px-3 py-1 font-mono text-[10px] tracking-widest text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
              aria-label="Save entry"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => handleCancelEdit(onCancel)}
              className="border border-black/20 px-3 py-1 font-mono text-[10px] tracking-widest text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
        </div>
      )
    },
    [editKey, editText, editSourceType, handleSaveEntry, handleCancelEdit],
  )

  const getEntryKey = useCallback((entry: BibliographyEntry) => entry.key, [])

  return (
    <div className="flex h-full flex-col">
      {/* Mode toggle */}
      <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
        <div className="flex gap-0.5" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            role="tab"
            aria-selected={editorMode === 'form'}
            aria-controls="bib-editor-panel"
            id="bib-form-tab"
            onClick={() => handleModeChange('form')}
            className={[
              'px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors',
              editorMode === 'form'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white',
            ].join(' ')}
          >
            Form
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={editorMode === 'markdown'}
            aria-controls="bib-editor-panel"
            id="bib-markdown-tab"
            onClick={() => handleModeChange('markdown')}
            className={[
              'px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors',
              editorMode === 'markdown'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white',
            ].join(' ')}
          >
            Markdown
            <span className="sr-only">(Ctrl/Cmd+Shift+M to toggle)</span>
          </button>
        </div>
        <span className="font-mono text-[10px] text-black/30 dark:text-white/30">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div
        id="bib-editor-panel"
        role="tabpanel"
        aria-labelledby={`bib-${editorMode}-tab`}
        className="flex min-h-0 flex-1 gap-4"
      >
        {/* Editor panel */}
        <div className="flex min-h-0 flex-1 flex-col">
          {editorMode === 'form' ? (
            <EntryEditor
              entries={entries}
              onChange={onChange}
              entryLabel="Entry"
              renderEntry={renderEntry}
              renderEditForm={renderEditForm}
              getEntryKey={getEntryKey}
              validateEntry={validateBibliographyEntry}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={handleMarkdownChange}
                onKeyDown={handleKeyDown}
                className="editor-textarea min-h-0 flex-1 resize-none border border-black/10 bg-transparent p-3 font-mono text-xs outline-none focus:border-black/30 dark:border-white/10 dark:text-white"
                placeholder={`# Format: key: sourceType | citation

react-docs: web | React Documentation. Meta Open Source, 2024. https://react.dev
js-spec: docs | ECMAScript 2024 Language Specification. Ecma International, 2024.

# Multiline citation:
long-ref: book | """
Author Name. Book Title, 2024.
Chapter 3, Section 2.
Publisher Name.
"""`}
                spellCheck={false}
                aria-label="Bibliography markdown editor"
                aria-describedby="bib-markdown-help"
              />
              <p
                id="bib-markdown-help"
                className="font-mono text-[9px] text-black/30 dark:text-white/30"
              >
                Press Ctrl/Cmd+Shift+M to switch to Form mode
              </p>
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div className="flex w-1/2 flex-col border-l border-black/10 pl-4 dark:border-white/10">
          <h3 className="mb-3 font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
            Preview
          </h3>

          {/* Error display */}
          {editorMode === 'markdown' && hasErrors && (
            <div
              className="mb-3"
              dangerouslySetInnerHTML={{ __html: errorHtml }}
              aria-live="polite"
              aria-atomic="true"
            />
          )}

          {/* Preview content */}
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            aria-label="Bibliography preview"
          />
        </div>
      </div>
    </div>
  )
}
