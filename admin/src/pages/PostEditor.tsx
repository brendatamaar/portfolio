import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
  type DragEvent,
  type ClipboardEvent,
} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  SaveIcon,
  GlobeIcon,
  EyeOffIcon,
  SunIcon,
  MoonIcon,
  ImageIcon,
  XIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Post, Tag } from '../lib/api.ts'
import Toolbar from '../components/Toolbar.tsx'
import Preview from '../components/Preview.tsx'
import ImageGallery from '../components/ImageGallery.tsx'
import { useTheme } from '../lib/theme.ts'
import type { Mode } from '../lib/types.ts'

export default function PostEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isNew = !id

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)
  const saveRef = useRef<() => void>(() => {})

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')

  const { isDark, toggle } = useTheme()
  const [mode, setMode] = useState<Mode>('split')
  const [syncScroll, setSyncScroll] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showCoverGallery, setShowCoverGallery] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [savedAgo, setSavedAgo] = useState('')
  const [loading, setLoading] = useState(!isNew)

  // Load existing post
  useEffect(() => {
    api.tags.list().then(setAllTags).catch(console.error)
    if (!isNew && id) {
      api.posts
        .list()
        .then((posts) => {
          const post = posts.find((p) => p.id === Number(id))
          if (!post) {
            navigate('/')
            return
          }
          setTitle(post.title)
          setSlug(post.slug)
          setDescription(post.description)
          setContent(post.content)
          setStatus(post.status)
          setCoverImageUrl(post.coverImageUrl ?? '')
          setSelectedTagIds(post.tags.map((t) => t.id))
        })
        .finally(() => setLoading(false))
    }
  }, [id, isNew, navigate])

  // Auto-slug from title (only for new posts, only if user hasn't edited slug)
  const slugTouched = useRef(false)
  useEffect(() => {
    if (isNew && !slugTouched.current) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-'),
      )
    }
  }, [title, isNew])

  // Sync scroll between editor and preview
  useEffect(() => {
    if (!syncScroll || mode !== 'split') return
    const ta = textareaRef.current
    const pv = previewRef.current
    if (!ta || !pv) return

    const onEditorScroll = () => {
      if (isSyncing.current) return
      isSyncing.current = true
      const pct = ta.scrollTop / (ta.scrollHeight - ta.clientHeight) || 0
      pv.scrollTop = pct * (pv.scrollHeight - pv.clientHeight)
      setTimeout(() => {
        isSyncing.current = false
      }, 50)
    }
    const onPreviewScroll = () => {
      if (isSyncing.current) return
      isSyncing.current = true
      const pct = pv.scrollTop / (pv.scrollHeight - pv.clientHeight) || 0
      ta.scrollTop = pct * (ta.scrollHeight - ta.clientHeight)
      setTimeout(() => {
        isSyncing.current = false
      }, 50)
    }

    ta.addEventListener('scroll', onEditorScroll)
    pv.addEventListener('scroll', onPreviewScroll)
    return () => {
      ta.removeEventListener('scroll', onEditorScroll)
      pv.removeEventListener('scroll', onPreviewScroll)
    }
  }, [syncScroll, mode])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current!

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault()
        saveRef.current()
        return
      }
      if (e.key === 'b') {
        e.preventDefault()
        document.execCommand('insertText', false, '****')
        const s = ta.selectionStart
        ta.setSelectionRange(s - 2, s - 2)
        return
      }
      if (e.key === 'i') {
        e.preventDefault()
        document.execCommand('insertText', false, '**')
        const s = ta.selectionStart
        ta.setSelectionRange(s - 1, s - 1)
        return
      }
      if (e.key === 'k') {
        e.preventDefault()
        document.execCommand('insertText', false, '[](url)')
        const s = ta.selectionStart - 6
        ta.setSelectionRange(s, s)
        return
      }
      if (e.key === 'p' && e.shiftKey) {
        e.preventDefault()
        setMode((m) => (m === 'preview' ? 'split' : 'preview'))
        return
      }
    }

    // Tab → 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      document.execCommand('insertText', false, '  ')
    }
  }, [])

  // Drag & drop images onto editor
  const handleDrop = useCallback(async (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    )
    for (const file of files) {
      const { url } = await api.images.upload(file)
      const md = `![${file.name}](${url})`
      document.execCommand('insertText', false, md)
    }
  }, [])

  // Paste images
  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.clipboardData.files).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (!files.length) return
      e.preventDefault()
      for (const file of files) {
        const { url } = await api.images.upload(file)
        const md = `![pasted-image](${url})`
        document.execCommand('insertText', false, md)
      }
    },
    [],
  )

  function insertImageUrl(url: string) {
    const ta = textareaRef.current
    if (!ta) return
    ta.focus()
    document.execCommand('insertText', false, `![image](${url})`)
  }

  async function save(toStatus?: 'draft' | 'published') {
    setSaving(true)
    setSaveMsg('')
    const payload = {
      title,
      slug,
      description,
      content,
      status: toStatus ?? status,
      coverImageUrl: coverImageUrl || null,
      tagIds: selectedTagIds,
    }
    try {
      if (isNew) {
        const post = await api.posts.create(payload)
        navigate(`/posts/${post.id}`, { replace: true })
      } else {
        await api.posts.update(Number(id), payload)
        if (toStatus) setStatus(toStatus)
      }
      setSaveMsg('')
      setLastSavedAt(new Date())
    } catch (err) {
      setSaveMsg('Save failed')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function addTag() {
    if (!newTagName.trim()) return
    const tag = await api.tags.create(newTagName.trim())
    setAllTags((prev) => [...prev, tag])
    setSelectedTagIds((prev) => [...prev, tag.id])
    setNewTagName('')
  }

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  // Update "saved X ago" display every 15 seconds
  useEffect(() => {
    if (!lastSavedAt) return
    const fmt = () => {
      const s = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000)
      if (s < 10) return 'Saved just now'
      if (s < 60) return `Saved ${s}s ago`
      return `Saved ${Math.floor(s / 60)}m ago`
    }
    setSavedAgo(fmt())
    const id = setInterval(() => setSavedAgo(fmt()), 15_000)
    return () => clearInterval(id)
  }, [lastSavedAt])

  // Heading outline parsed from content
  const headings = useMemo(
    () =>
      [...content.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => ({
        level: m[1].length,
        text: m[2].trim(),
        index: m.index ?? 0,
      })),
    [content],
  )

  function jumpToHeading(charIndex: number) {
    const ta = textareaRef.current
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(charIndex, charIndex)
    const linesBefore = content.slice(0, charIndex).split('\n').length - 1
    const lineHeight = ta.scrollHeight / Math.max(content.split('\n').length, 1)
    ta.scrollTop = linesBefore * lineHeight - ta.clientHeight / 3
  }

  // Keep saveRef current so handleKeyDown can call it without stale closure
  saveRef.current = () => {
    save()
  }

  const wordCount = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          Loading...
        </p>
      </div>
    )
  }

  const editorVisible = mode === 'split' || mode === 'editor'
  const previewVisible = mode === 'split' || mode === 'preview'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
      {/* Top nav */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 px-4 dark:border-white/10">
        <Link
          to="/"
          className="shrink-0 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          <ArrowLeftIcon size={15} />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="min-w-0 flex-1 bg-transparent text-base font-black tracking-tight text-black uppercase placeholder-black/20 outline-none dark:text-white dark:placeholder-white/20"
          />
          {/* Status badge */}
          <span
            className={[
              'shrink-0 border px-1.5 py-0.5 font-mono text-[9px] tracking-widest uppercase',
              status === 'published'
                ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
                : 'border-black/15 text-black/30 dark:border-white/15 dark:text-white/30',
            ].join(' ')}
          >
            {status}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {saveMsg && (
            <span className="font-mono text-[10px] tracking-widest text-red-500 uppercase">
              {saveMsg}
            </span>
          )}
          {!saveMsg && savedAgo && (
            <span className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
              {savedAgo}
            </span>
          )}

          {status === 'published' ? (
            <button
              onClick={() => save('draft')}
              disabled={saving}
              className="flex items-center gap-1.5 border border-black/20 px-3 py-1.5 text-xs font-bold tracking-wide text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black disabled:opacity-50 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
            >
              <EyeOffIcon size={12} />
              Unpublish
            </button>
          ) : (
            <button
              onClick={() => save('published')}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#FFE600] px-3 py-1.5 text-xs font-bold tracking-wide text-black uppercase transition-colors hover:bg-yellow-300 disabled:opacity-50"
            >
              <GlobeIcon size={12} />
              Publish
            </button>
          )}

          <button
            onClick={() => save()}
            disabled={saving}
            className="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            <SaveIcon size={12} />
            Save
          </button>

          <button
            onClick={toggle}
            className="p-1.5 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
            title="Toggle theme"
          >
            {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        textareaRef={textareaRef}
        mode={mode}
        onModeChange={setMode}
        onImageClick={() => setShowGallery(true)}
        syncScroll={syncScroll}
        onSyncScrollChange={setSyncScroll}
        metaOpen={showMeta}
        onMetaToggle={() => setShowMeta((v) => !v)}
      />

      {/* Editor / Preview panes + Meta sidebar */}
      <div className="flex min-h-0 flex-1">
        {/* Editor + Preview */}
        <div className="flex min-h-0 flex-1 divide-x divide-black/10 dark:divide-white/10">
          {editorVisible && (
            <div
              className={`flex min-h-0 flex-col ${mode === 'split' ? 'w-1/2' : 'w-full'}`}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onDrop={handleDrop}
                onPaste={handlePaste}
                spellCheck={false}
                className="editor-textarea editor-pane"
                placeholder="Start writing in markdown..."
              />
            </div>
          )}

          {previewVisible && (
            <div
              ref={previewRef}
              className={`min-h-0 overflow-y-auto ${mode === 'split' ? 'w-1/2' : 'w-full'}`}
            >
              <Preview markdown={content} />
            </div>
          )}
        </div>

        {/* Meta sidebar */}
        {showMeta && (
          <div className="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-black/10 bg-[#f5f5f5] dark:border-white/10 dark:bg-[#0d0d0d]">
            <div className="flex flex-col gap-5 p-4">
              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
                  Slug
                </label>
                <input
                  value={slug}
                  onChange={(e) => {
                    slugTouched.current = true
                    setSlug(e.target.value)
                  }}
                  className="w-full border-b border-black/15 bg-transparent pb-1 font-mono text-xs text-black/70 transition-colors outline-none focus:border-black/40 dark:border-white/15 dark:text-white/70 dark:focus:border-white/40"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description..."
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
                        onClick={() => setShowCoverGallery(true)}
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
                    onClick={() => setShowCoverGallery(true)}
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
                    e.key === 'Enter' && (e.preventDefault(), addTag())
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
                        onClick={() => jumpToHeading(h.index)}
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

            {/* Word count at bottom of sidebar */}
            <div className="mt-auto flex gap-3 border-t border-black/10 px-4 py-2.5 dark:border-white/10">
              <span className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
                {wordCount} words
              </span>
              <span className="font-mono text-[10px] tracking-widest text-black/20 uppercase dark:text-white/20">
                {content.length} chars
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer (hidden when meta sidebar is open) */}
      {!showMeta && (
        <div className="flex h-7 shrink-0 items-center gap-4 border-t border-black/10 bg-[#f5f5f5] px-4 dark:border-white/10 dark:bg-[#0d0d0d]">
          <span className="font-mono text-[10px] tracking-widest text-black/30 uppercase dark:text-white/30">
            {wordCount} words
          </span>
          <span className="font-mono text-[10px] tracking-widest text-black/20 uppercase dark:text-white/20">
            {content.length} chars
          </span>
        </div>
      )}

      {/* Image gallery modal — insert into editor */}
      {showGallery && (
        <ImageGallery
          onSelect={insertImageUrl}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Image gallery modal — pick cover */}
      {showCoverGallery && (
        <ImageGallery
          onSelect={(url) => setCoverImageUrl(url)}
          onClose={() => setShowCoverGallery(false)}
        />
      )}
    </div>
  )
}
