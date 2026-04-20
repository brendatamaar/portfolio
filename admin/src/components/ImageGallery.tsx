import { useState, useEffect, useCallback, useRef } from 'react'
import { XIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Image } from '../lib/api.ts'
import type { ImageGalleryProps } from '../types/ui'
import { useImageUpload } from '../hooks/useImageUpload.ts'

export default function ImageGallery({ onSelect, onClose }: ImageGalleryProps) {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Return focus to the element that was active before this modal opened
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => {
      prev?.focus()
    }
  }, [])

  useEffect(() => {
    api.images
      .list()
      .then(setImages)
      .finally(() => setLoading(false))
  }, [])

  const { upload } = useImageUpload({
    onSuccess: (result, file) => {
      setImages((prev) => [
        {
          id: result.id,
          filename: result.filename,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          url: result.url,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    onError: (_file, err) => {
      console.error('Upload failed:', err)
    },
  })

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      setUploading(true)
      await upload(Array.from(files))
      setUploading(false)
    },
    [upload],
  )

  async function handleDelete(img: Image) {
    if (!confirm(`Delete "${img.originalName}"?`)) return
    await api.images.delete(img.id)
    setImages((prev) => prev.filter((x) => x.id !== img.id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col border border-black/20 bg-[#f0f0f0] dark:border-white/20 dark:bg-[#111]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-black tracking-tight uppercase">
            Image Gallery
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close image gallery"
            className="text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Upload bar */}
        <div className="flex items-center gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
          <label className="flex cursor-pointer items-center gap-2 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
            <UploadIcon size={12} />
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
          <span className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
            Click an image to insert it
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
              Loading...
            </p>
          ) : images.length === 0 ? (
            <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
              No images yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(img.url)
                      onClose()
                    }}
                    className="block h-full w-full overflow-hidden border border-black/10 transition-colors hover:border-black/40 dark:border-white/10 dark:hover:border-white/40"
                  >
                    <img
                      src={img.url}
                      alt={img.originalName}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(img)}
                    className="absolute top-1 right-1 bg-black/70 p-1 text-white/50 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                    aria-label={`Delete ${img.originalName}`}
                    title="Delete"
                  >
                    <Trash2Icon size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
