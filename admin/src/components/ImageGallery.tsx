import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckIcon, ImageIcon, Trash2Icon, UploadIcon, XIcon } from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Image } from '../lib/api.ts'
import type { ImageGalleryProps } from '../types/ui'
import { useImageUpload } from '../hooks/useImageUpload.ts'

export default function ImageGallery({
  onSelect,
  onClose,
  enableInsertDetails = false,
}: ImageGalleryProps) {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
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
      const image = {
        id: result.id,
        filename: result.filename,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        url: result.url,
        createdAt: new Date().toISOString(),
      }
      setImages((prev) => [
        image,
        ...prev,
      ])
      if (enableInsertDetails) {
        setSelectedImage(image)
        setAltText(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
        setCaption('')
      }
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

  function selectImage(img: Image) {
    if (!enableInsertDetails) {
      onSelect(img.url)
      onClose()
      return
    }

    setSelectedImage(img)
    setAltText((current) => current || img.originalName.replace(/\.[^.]+$/, ''))
  }

  function insertSelectedImage() {
    if (!selectedImage) return
    onSelect(selectedImage.url, {
      altText: altText.trim(),
      caption: caption.trim(),
    })
    onClose()
  }

  async function handleDelete(img: Image) {
    if (!confirm(`Delete "${img.originalName}"?`)) return
    await api.images.delete(img.id)
    setImages((prev) => prev.filter((x) => x.id !== img.id))
    if (selectedImage?.id === img.id) {
      setSelectedImage(null)
      setAltText('')
      setCaption('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col border border-black/20 bg-[#f0f0f0] dark:border-white/20 dark:bg-[#111]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-black tracking-tight uppercase">
            {enableInsertDetails ? 'Insert Image' : 'Image Gallery'}
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
        <div className="flex flex-wrap items-center gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
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
            {enableInsertDetails
              ? 'Select an image, then add details'
              : 'Click an image to select it'}
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px]">
          {/* Grid */}
          <div className="min-h-0 overflow-y-auto p-4">
            {loading ? (
              <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
                Loading...
              </p>
            ) : images.length === 0 ? (
              <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
                No images yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {images.map((img) => {
                  const selected = selectedImage?.id === img.id

                  return (
                    <div key={img.id} className="group relative aspect-square">
                      <button
                        type="button"
                        onClick={() => selectImage(img)}
                        className={[
                          'block h-full w-full overflow-hidden border transition-colors',
                          selected
                            ? 'border-black ring-2 ring-black/30 dark:border-white dark:ring-white/30'
                            : 'border-black/10 hover:border-black/40 dark:border-white/10 dark:hover:border-white/40',
                        ].join(' ')}
                      >
                        <img
                          src={img.url}
                          alt={img.originalName}
                          className="h-full w-full object-cover"
                        />
                      </button>
                      {selected && (
                        <div className="absolute top-1 left-1 bg-black p-1 text-white dark:bg-white dark:text-black">
                          <CheckIcon size={11} />
                        </div>
                      )}
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
                  )
                })}
              </div>
            )}
          </div>

          {enableInsertDetails && (
            <div className="flex min-h-0 flex-col border-t border-black/10 p-4 dark:border-white/10 md:border-t-0 md:border-l">
              <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                {selectedImage ? (
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.originalName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon
                    size={28}
                    className="text-black/25 dark:text-white/25"
                  />
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
                    Alt text
                  </span>
                  <input
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="h-9 border border-black/15 bg-transparent px-3 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
                    placeholder="Describe the image"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
                    Caption
                  </span>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-20 resize-none border border-black/15 bg-transparent px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black dark:border-white/15 dark:text-white dark:focus:border-white"
                    placeholder="Shown below the image when supported"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-black/10 pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 font-mono text-[10px] tracking-widest text-black/50 uppercase transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertSelectedImage}
                  disabled={!selectedImage}
                  className="bg-black px-3 py-2 font-mono text-[10px] tracking-widest text-white uppercase transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-black/30 dark:bg-white dark:text-black dark:hover:bg-white/80 dark:disabled:bg-white/20 dark:disabled:text-white/30"
                >
                  Insert image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
