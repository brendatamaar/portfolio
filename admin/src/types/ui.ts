import type { RefObject } from 'react'
import type { Mode } from './editor'

export interface ImageGalleryProps {
  onSelect: (url: string) => void
  onClose: () => void
}

export interface PreviewProps {
  markdown: string
  fullWidth?: boolean
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
