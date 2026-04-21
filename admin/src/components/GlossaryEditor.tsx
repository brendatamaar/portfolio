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
import type { GlossaryEntry } from '../types/api.js'
import EntryEditor from './EntryEditor.js'
import {
  glossaryToMarkdown,
  glossaryFromMarkdown,
  renderGlossaryPreview,
  renderParseErrors,
  validateGlossaryEntry,
  getStoredEditorMode,
  setStoredEditorMode,
  type ParseResult,
} from '../lib/glossaryBibliography.ts'
import { MARKDOWN_SYNC_DEBOUNCE_MS } from '../lib/constants.ts'

interface GlossaryEditorProps {
  entries: GlossaryEntry[]
  onChange: (entries: GlossaryEntry[]) => void
  editorMode: 'form' | 'markdown'
  onEditorModeChange: (mode: 'form' | 'markdown') => void
}

export default function GlossaryEditor({
  entries,
  onChange,
  editorMode,
  onEditorModeChange,
}: GlossaryEditorProps) {
  // Local state for markdown editing
  const [markdown, setMarkdown] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult<GlossaryEntry>>({
    entries: [],
    errors: [],
    isValid: true,
  })
  const [editKey, setEditKey] = useState('')
  const [editTerm, setEditTerm] = useState('')
  const [editDefinition, setEditDefinition] = useState('')

  // Refs for debouncing and textarea
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync markdown when entries change (form → markdown)
  useEffect(() => {
    if (editorMode === 'markdown') {
      const newMarkdown = glossaryToMarkdown(entries)
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
        const result = glossaryFromMarkdown(newMarkdown)
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
      setStoredEditorMode('glossary', newMode)
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
    let previewEntries: GlossaryEntry[]
    let currentErrors = parseResult.errors

    if (editorMode === 'markdown') {
      const result = glossaryFromMarkdown(deferredMarkdown)
      previewEntries = result.entries
      currentErrors = result.errors
    } else {
      previewEntries = entries
    }

    return {
      previewHtml: renderGlossaryPreview(previewEntries),
      hasErrors: currentErrors.length > 0,
      errorHtml: renderParseErrors(currentErrors),
    }
  }, [editorMode, deferredMarkdown, entries, parseResult.errors])

  // Form editing handlers
  const handleSaveEntry = useCallback(
    (onSave: (entry: GlossaryEntry) => void) => {
      const entry: GlossaryEntry = {
        key: editKey.trim(),
        term: editTerm.trim(),
        definition: editDefinition.trim(),
      }
      onSave(entry)
      setEditKey('')
      setEditTerm('')
      setEditDefinition('')
    },
    [editKey, editTerm, editDefinition],
  )

  const handleCancelEdit = useCallback((onCancel: () => void) => {
    setEditKey('')
    setEditTerm('')
    setEditDefinition('')
    onCancel()
  }, [])

  const renderEntry = useCallback(
    (entry: GlossaryEntry) => (
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
    ),
    [],
  )

  const renderEditForm = useCallback(
    (
      entry: GlossaryEntry | null,
      onSave: (entry: GlossaryEntry) => void,
      onCancel: () => void,
    ) => {
      const isExistingEntry = entry?.key && entry.key.length > 0

      if (entry && isExistingEntry && editKey === '' && editTerm === '') {
        setEditKey(entry.key)
        setEditTerm(entry.term)
        setEditDefinition(entry.definition)
      }

      const isValid = editKey.trim() && editTerm.trim() && editDefinition.trim()

      return (
        <div className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="glossary-key"
              className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40"
            >
              Key
            </label>
            <input
              id="glossary-key"
              type="text"
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              className="w-full border-b border-black/20 bg-transparent pb-1 font-mono text-sm outline-none focus:border-black/50 dark:border-white/20 dark:text-white"
              placeholder="e.g., startViewTransition"
              autoFocus
              aria-describedby="glossary-key-hint"
            />
            <p
              id="glossary-key-hint"
              className="mt-1 font-mono text-[9px] text-black/30 dark:text-white/30"
            >
              Use in content: [gloss:{editKey || 'key'}]
            </p>
          </div>
          <div>
            <label
              htmlFor="glossary-term"
              className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40"
            >
              Term
            </label>
            <input
              id="glossary-term"
              type="text"
              value={editTerm}
              onChange={(e) => setEditTerm(e.target.value)}
              className="w-full border-b border-black/20 bg-transparent pb-1 font-mono text-sm outline-none focus:border-black/50 dark:border-white/20 dark:text-white"
              placeholder="e.g., document.startViewTransition()"
            />
          </div>
          <div>
            <label
              htmlFor="glossary-definition"
              className="mb-1 block font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40"
            >
              Definition
            </label>
            <textarea
              id="glossary-definition"
              value={editDefinition}
              onChange={(e) => setEditDefinition(e.target.value)}
              rows={3}
              className="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs outline-none focus:border-black/30 dark:border-white/10 dark:text-white"
              placeholder="Enter definition..."
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
    [editKey, editTerm, editDefinition, handleSaveEntry, handleCancelEdit],
  )

  const getEntryKey = useCallback((entry: GlossaryEntry) => entry.key, [])

  return (
    <div className="flex h-full flex-col">
      {/* Mode toggle */}
      <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
        <div className="flex gap-0.5" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            role="tab"
            aria-selected={editorMode === 'form'}
            aria-controls="glossary-editor-panel"
            id="glossary-form-tab"
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
            aria-controls="glossary-editor-panel"
            id="glossary-markdown-tab"
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
        id="glossary-editor-panel"
        role="tabpanel"
        aria-labelledby={`glossary-${editorMode}-tab`}
        className="flex min-h-0 flex-1 gap-4"
      >
        {/* Editor panel */}
        <div className="flex min-h-0 flex-1 flex-col">
          {editorMode === 'form' ? (
            <EntryEditor
              entries={entries}
              onChange={onChange}
              entryLabel="Term"
              renderEntry={renderEntry}
              renderEditForm={renderEditForm}
              getEntryKey={getEntryKey}
              validateEntry={validateGlossaryEntry}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={handleMarkdownChange}
                onKeyDown={handleKeyDown}
                className="editor-textarea min-h-0 flex-1 resize-none border border-black/10 bg-transparent p-3 font-mono text-xs outline-none focus:border-black/30 dark:border-white/10 dark:text-white"
                placeholder={`# Format: key: term | definition

startViewTransition: document.startViewTransition() | API for view transitions
DOM: Document Object Model | The structure of HTML documents

# Multiline definition:
complex-term: "Complex Term" | """
This is a multiline
definition.
"""`}
                spellCheck={false}
                aria-label="Glossary markdown editor"
                aria-describedby="glossary-markdown-help"
              />
              <p
                id="glossary-markdown-help"
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
            aria-label="Glossary preview"
          />
        </div>
      </div>
    </div>
  )
}
