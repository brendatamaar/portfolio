import {
  useRef,
  type KeyboardEvent,
  type DragEvent,
  type ClipboardEvent,
} from 'react'
import { useImageUpload } from '../hooks/useImageUpload.ts'
import Toolbar from './Toolbar.tsx'
import Preview from './Preview.tsx'
import type { Mode } from '../types/editor'

interface ContentTabProps {
  activeContent: string
  setActiveContent: (content: string) => void
  mode: Mode
  setMode: (mode: Mode) => void
  syncScroll: boolean
  setSyncScroll: (sync: boolean) => void
  showMeta: boolean
  setShowMeta: (show: boolean) => void
  onImageClick: () => void
  saveMsg: string
  langTab: 'en' | 'id'
}

export default function ContentTab({
  activeContent,
  setActiveContent,
  mode,
  setMode,
  syncScroll,
  setSyncScroll,
  showMeta,
  setShowMeta,
  onImageClick,
  saveMsg,
  langTab,
}: ContentTabProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const { upload: uploadImages } = useImageUpload({
    onSuccess: ({ url }, file) => {
      document.execCommand('insertText', false, `![${file.name}](${url})`)
    },
    onError: () => {
      // Error handled by parent
    },
  })

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current!

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault()
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const sel = ta.value.slice(start, end)
        document.execCommand('insertText', false, `**${sel}**`)
        sel
          ? ta.setSelectionRange(start + 2, end + 2)
          : ta.setSelectionRange(start + 2, start + 2)
        return
      }
      if (e.key === 'i') {
        e.preventDefault()
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const sel = ta.value.slice(start, end)
        document.execCommand('insertText', false, `*${sel}*`)
        sel
          ? ta.setSelectionRange(start + 1, end + 1)
          : ta.setSelectionRange(start + 1, start + 1)
        return
      }
      if (e.key === 'k') {
        e.preventDefault()
        document.execCommand('insertText', false, '[](url)')
        const s = ta.selectionStart - 6
        ta.setSelectionRange(s, s)
        return
      }
    }

    // Tab → 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      document.execCommand('insertText', false, '  ')
    }
  }

  const handleDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    )
    void uploadImages(files)
  }

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith('image/'),
    )
    if (!files.length) return
    e.preventDefault()
    void uploadImages(files)
  }

  const editorVisible = mode === 'split' || mode === 'editor'
  const previewVisible = mode === 'split' || mode === 'preview'

  return (
    <>
      <Toolbar
        textareaRef={textareaRef}
        mode={mode}
        onModeChange={setMode}
        onImageClick={onImageClick}
        syncScroll={syncScroll}
        onSyncScrollChange={setSyncScroll}
        metaOpen={showMeta}
        onMetaToggle={() => setShowMeta(!showMeta)}
      />

      {saveMsg && (
        <div className="border-b border-black/10 bg-red-50 px-4 py-2 font-mono text-[11px] text-red-600 dark:border-white/10 dark:bg-red-900/20 dark:text-red-400">
          {saveMsg}
        </div>
      )}

      <div className="flex min-h-0 flex-1 divide-x divide-black/10 dark:divide-white/10">
        {editorVisible && (
          <div
            className={`flex min-h-0 flex-col ${mode === 'split' ? 'w-1/2' : 'w-full'}`}
          >
            <textarea
              ref={textareaRef}
              value={activeContent}
              onChange={(e) => setActiveContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onDrop={handleDrop}
              onPaste={handlePaste}
              spellCheck={false}
              className="editor-textarea editor-pane h-full w-full resize-none border-none bg-transparent p-4 font-mono text-sm leading-relaxed text-black outline-none dark:text-white"
              placeholder={
                langTab === 'id'
                  ? 'Mulai menulis dalam markdown... (ID)'
                  : 'Start writing in markdown...'
              }
            />
          </div>
        )}

        {previewVisible && (
          <div
            ref={previewRef}
            className={`min-h-0 overflow-y-auto ${mode === 'split' ? 'w-1/2' : 'w-full'}`}
          >
            <Preview markdown={activeContent} fullWidth={mode === 'preview'} />
          </div>
        )}
      </div>
    </>
  )
}
