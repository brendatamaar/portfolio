import { useState, useEffect } from 'react'
import { XIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Image } from '../lib/api.ts'

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function ImageGallery({ onSelect, onClose }: Props) {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api.images.list().then(setImages).finally(() => setLoading(false))
  }, [])

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const result = await api.images.upload(file)
        setImages((prev) => [
          { id: result.id, filename: result.filename, originalName: file.name, mimeType: file.type, sizeBytes: file.size, url: result.url, createdAt: Date.now() / 1000 },
          ...prev,
        ])
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(img: Image) {
    if (!confirm(`Delete "${img.originalName}"?`)) return
    await api.images.delete(img.id)
    setImages((prev) => prev.filter((x) => x.id !== img.id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-[#111] border border-white/20 w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-black text-sm uppercase tracking-tight">Image Gallery</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        {/* Upload bar */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-white text-black font-bold text-xs uppercase tracking-wide px-3 py-1.5 hover:bg-white/80 transition-colors">
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
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
            Click an image to insert it
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Loading...</p>
          ) : images.length === 0 ? (
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest">No images yet.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group aspect-square">
                  <button
                    type="button"
                    onClick={() => { onSelect(img.url); onClose() }}
                    className="block w-full h-full border border-white/10 hover:border-white/40 transition-colors overflow-hidden"
                  >
                    <img
                      src={img.url}
                      alt={img.originalName}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(img)}
                    className="absolute top-1 right-1 p-1 bg-black/70 text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
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
