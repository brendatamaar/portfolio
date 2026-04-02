import type { RefObject } from 'react'

export type Mode = 'split' | 'editor' | 'preview'

export type StatusFilter = 'all' | 'draft' | 'published'

export interface ImageGalleryProps {
  onSelect: (url: string) => void
  onClose: () => void
}

export interface PreviewProps {
  markdown: string
}

export interface ToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  mode: Mode
  onModeChange: (m: Mode) => void
  onImageClick: () => void
  syncScroll: boolean
  onSyncScrollChange: (v: boolean) => void
  metaOpen: boolean
  onMetaToggle: () => void
}
