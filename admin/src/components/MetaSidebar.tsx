import { useRef } from 'react'
import { ImageIcon, XIcon, RefreshCwIcon } from 'lucide-react'
import type { Tag } from '../types/api.js'

interface MetaSidebarProps {
  slug: string
  setSlug: (slug: string) => void
  publishedAt: string
  setPublishedAt: (date: string) => void
  description: string
  setDescription: (desc: string) => void
  descriptionId: string
  setDescriptionId: (desc: string) => void
  coverImageUrl: string
  setCoverImageUrl: (url: string) => void
  selectedTagIds: number[]
  toggleTag: (id: number) => void
  allTags: Tag[]
  newTagName: string
  setNewTagName: (name: string) => void
  onAddTag: () => void
  onShowCoverGallery: () => void
  langTab: 'en' | 'id'
  headings: Array<{ level: number; text: string; index: number }>
  onJumpToHeading: (index: number) => void
}

export default function MetaSidebar({
  slug,
  setSlug,
  publishedAt,
  setPublishedAt,
  description,
  setDescription,
  descriptionId,
  setDescriptionId,
  coverImageUrl,
  setCoverImageUrl,
  selectedTagIds,
  toggleTag,
  allTags,
  newTagName,
  setNewTagName,
  onAddTag,
  onShowCoverGallery,
  langTab,
  headings,
  onJumpToHeading,
}: MetaSidebarProps) {
  const slugTouched = useRef(false)
  const activeDescription = langTab === 'id' ? descriptionId : description
  const setActiveDescription =
    langTab === 'id' ? setDescriptionId : setDescription

  return (
    <div className="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-black/10 bg-[#f5f5f5] dark:border-white/10 dark:bg-[#0d0d0d]">
      <div className="flex flex-col gap-5 p-4">
        {/* Slug */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="meta-slug"
            className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30"
          >
            Slug
          </label>
          <input
            id="meta-slug"
            value={slug}
            onChange={(e) => {
              slugTouched.current = true
              setSlug(e.target.value)
            }}
            className="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 transition-colors outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40"
          />
        </div>

        {/* Published at */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="meta-published-at"
            className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30"
          >
            Published at
          </label>
          <input
            id="meta-published-at"
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 transition-colors outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="meta-description"
            className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30"
          >
            Description {langTab === 'id' ? '(ID)' : '(EN)'}
          </label>
          <textarea
            id="meta-description"
            value={activeDescription}
            onChange={(e) => setActiveDescription(e.target.value)}
            placeholder={
              langTab === 'id'
                ? 'Deskripsi singkat... (ID)'
                : 'Short description...'
            }
            rows={3}
            className="w-full resize-none border border-black/10 bg-transparent p-2 font-mono text-xs text-black/70 placeholder-black/20 transition-colors outline-none focus:border-black/30 dark:border-white/10 dark:text-white/70 dark:placeholder-white/20 dark:focus:border-white/30"
          />
        </div>

        {/* Cover image */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
            Cover image
          </label>
          {coverImageUrl ? (
            <div className="group relative aspect-video w-full overflow-hidden border border-black/10 dark:border-white/10">
              <img
                src={coverImageUrl}
                alt="Cover"
                className="h-full w-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-colors group-hover:bg-black/50 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={onShowCoverGallery}
                  title="Change cover"
                  className="bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
                >
                  <RefreshCwIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  title="Remove cover"
                  className="bg-white/10 p-1.5 text-white transition-colors hover:bg-red-500/60"
                >
                  <XIcon size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onShowCoverGallery}
              className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 border border-dashed border-black/20 text-black/30 transition-colors hover:border-black/40 hover:text-black/50 dark:border-white/20 dark:text-white/30 dark:hover:border-white/40 dark:hover:text-white/50"
            >
              <ImageIcon size={18} />
              <span className="font-mono text-[10px] tracking-widest uppercase">
                Select cover
              </span>
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={[
                  'border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase transition-colors',
                  selectedTagIds.includes(tag.id)
                    ? 'border-black bg-black/10 text-black dark:border-white dark:bg-white/10 dark:text-white'
                    : 'border-black/20 text-black/30 hover:border-black/40 dark:border-white/20 dark:text-white/30 dark:hover:border-white/40',
                ].join(' ')}
              >
                #{tag.name}
              </button>
            ))}
          </div>
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && (e.preventDefault(), onAddTag())
            }
            placeholder="+ new tag"
            className="w-full border-b border-black/10 bg-transparent pb-0.5 font-mono text-[10px] tracking-wide text-black/40 uppercase placeholder-black/20 transition-colors outline-none focus:border-black/30 dark:border-white/10 dark:text-white/40 dark:placeholder-white/20 dark:focus:border-white/30"
          />
        </div>

        {/* Heading outline */}
        {headings.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
              Outline
            </label>
            <div className="flex flex-col gap-0.5">
              {headings.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onJumpToHeading(h.index)}
                  style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                  className="truncate text-left font-mono text-[10px] text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
                >
                  {h.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
