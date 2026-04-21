import { useEffect } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] dark:border-white dark:bg-[#1a1a1a] dark:shadow-[4px_4px_0px_#fff]">
        <h3 className="mb-2 font-mono text-sm font-bold tracking-widest uppercase dark:text-white">
          {title}
        </h3>
        <p className="mb-6 font-mono text-xs leading-relaxed text-black/70 dark:text-white/70">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#FFE600] px-4 py-2 font-mono text-[11px] font-bold tracking-widest text-black uppercase transition-colors hover:bg-yellow-400"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-black/20 px-4 py-2 font-mono text-[11px] tracking-widest text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
