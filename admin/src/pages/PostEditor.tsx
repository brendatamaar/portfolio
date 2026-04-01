import {
  useState, useEffect, useRef, useCallback, useMemo,
  type KeyboardEvent, type DragEvent, type ClipboardEvent,
} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeftIcon, SaveIcon, GlobeIcon, EyeOffIcon, SunIcon, MoonIcon, ImageIcon, XIcon, RefreshCwIcon } from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Post, Tag } from '../lib/api.ts'
import Toolbar from '../components/Toolbar.tsx'
import Preview from '../components/Preview.tsx'
import ImageGallery from '../components/ImageGallery.tsx'
import { useTheme } from '../lib/theme.ts'

type Mode = 'split' | 'editor' | 'preview'

export default function PostEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isNew = !id

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)
  const saveRef = useRef<() => void>(() => { })

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
  const [loading, setLoading] = useState(!isNew)

  // Load existing post
  useEffect(() => {
    api.tags.list().then(setAllTags).catch(console.error)
    if (!isNew && id) {
      api.posts.list().then((posts) => {
        const post = posts.find((p) => p.id === Number(id))
        if (!post) { navigate('/'); return }
        setTitle(post.title)
        setSlug(post.slug)
        setDescription(post.description)
        setContent(post.content)
        setStatus(post.status)
        setCoverImageUrl(post.coverImageUrl ?? '')
        setSelectedTagIds(post.tags.map((t) => t.id))
      }).finally(() => setLoading(false))
    }
  }, [id, isNew, navigate])

  // Auto-slug from title (only for new posts, only if user hasn't edited slug)
  const slugTouched = useRef(false)
  useEffect(() => {
    if (isNew && !slugTouched.current) {
      setSlug(title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'))
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
      setTimeout(() => { isSyncing.current = false }, 50)
    }
    const onPreviewScroll = () => {
      if (isSyncing.current) return
      isSyncing.current = true
      const pct = pv.scrollTop / (pv.scrollHeight - pv.clientHeight) || 0
      ta.scrollTop = pct * (ta.scrollHeight - ta.clientHeight)
      setTimeout(() => { isSyncing.current = false }, 50)
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
      if (e.key === 's') { e.preventDefault(); saveRef.current(); return }
      if (e.key === 'b') { e.preventDefault(); document.execCommand('insertText', false, '****'); const s = ta.selectionStart; ta.setSelectionRange(s - 2, s - 2); return }
      if (e.key === 'i') { e.preventDefault(); document.execCommand('insertText', false, '**'); const s = ta.selectionStart; ta.setSelectionRange(s - 1, s - 1); return }
      if (e.key === 'k') { e.preventDefault(); document.execCommand('insertText', false, '[](url)'); const s = ta.selectionStart - 6; ta.setSelectionRange(s, s); return }
      if (e.key === 'p' && e.shiftKey) { e.preventDefault(); setMode((m) => m === 'preview' ? 'split' : 'preview'); return }
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
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    for (const file of files) {
      const { url } = await api.images.upload(file)
      const md = `![${file.name}](${url})`
      document.execCommand('insertText', false, md)
    }
  }, [])

  // Paste images
  const handlePaste = useCallback(async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    e.preventDefault()
    for (const file of files) {
      const { url } = await api.images.upload(file)
      const md = `![pasted-image](${url})`
      document.execCommand('insertText', false, md)
    }
  }, [])

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
      setSaveMsg('Saved')
      setTimeout(() => setSaveMsg(''), 2000)
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
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Keep saveRef current so handleKeyDown can call it without stale closure
  saveRef.current = () => { save() }

  const wordCount = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <p className="font-mono text-xs text-black/40 dark:text-white/40 uppercase tracking-widest">Loading...</p>
      </div>
    )
  }

  const editorVisible = mode === 'split' || mode === 'editor'
  const previewVisible = mode === 'split' || mode === 'preview'

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#0a0a0a] text-black dark:text-white overflow-hidden">
      {/* Top nav */}
      <header className="h-14 border-b border-black/10 dark:border-white/10 flex items-center gap-3 px-4 shrink-0">
        <Link to="/" className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors shrink-0">
          <ArrowLeftIcon size={15} />
        </Link>

        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="bg-transparent font-black text-base uppercase tracking-tight text-black dark:text-white placeholder-black/20 dark:placeholder-white/20 outline-none flex-1 min-w-0"
          />
          {/* Status badge */}
          <span className={[
            'font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 shrink-0 border',
            status === 'published'
              ? 'border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/10'
              : 'border-black/15 dark:border-white/15 text-black/30 dark:text-white/30',
          ].join(' ')}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveMsg && (
            <span className="font-mono text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest">
              {saveMsg}
            </span>
          )}

          {status === 'published' ? (
            <button
              onClick={() => save('draft')}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:border-black/40 dark:hover:border-white/40 transition-colors disabled:opacity-50"
            >
              <EyeOffIcon size={12} />
              Unpublish
            </button>
          ) : (
            <button
              onClick={() => save('published')}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 bg-[#FFE600] text-black hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
              <GlobeIcon size={12} />
              Publish
            </button>
          )}

          <button
            onClick={() => save()}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors disabled:opacity-50"
          >
            <SaveIcon size={12} />
            Save
          </button>

          <button
            onClick={toggle}
            className="p-1.5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
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
      <div className="flex flex-1 min-h-0">
        {/* Editor + Preview */}
        <div className="flex flex-1 min-h-0 divide-x divide-black/10 dark:divide-white/10">
          {editorVisible && (
            <div className={`flex flex-col min-h-0 ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
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
            <div ref={previewRef} className={`overflow-y-auto min-h-0 ${mode === 'split' ? 'w-1/2' : 'w-full'}`}>
              <Preview markdown={content} />
            </div>
          )}
        </div>

        {/* Meta sidebar */}
        {showMeta && (
          <div className="w-64 shrink-0 border-l border-black/10 dark:border-white/10 overflow-y-auto bg-[#f5f5f5] dark:bg-[#0d0d0d] flex flex-col">
            <div className="flex flex-col gap-5 p-4">

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => { slugTouched.current = true; setSlug(e.target.value) }}
                  className="bg-transparent font-mono text-xs text-black/70 dark:text-white/70 outline-none border-b border-black/15 dark:border-white/15 focus:border-black/40 dark:focus:border-white/40 pb-1 transition-colors w-full"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description..."
                  rows={3}
                  className="bg-transparent font-mono text-xs text-black/70 dark:text-white/70 placeholder-black/20 dark:placeholder-white/20 outline-none border border-black/10 dark:border-white/10 focus:border-black/30 dark:focus:border-white/30 p-2 resize-none transition-colors w-full"
                />
              </div>

              {/* Cover image */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30">Cover image</label>
                {coverImageUrl ? (
                  <div className="relative group w-full aspect-video border border-black/10 dark:border-white/10 overflow-hidden">
                    <img
                      src={coverImageUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setShowCoverGallery(true)}
                        title="Change cover"
                        className="p-1.5 bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <RefreshCwIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl('')}
                        title="Remove cover"
                        className="p-1.5 bg-white/10 hover:bg-red-500/60 text-white transition-colors"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCoverGallery(true)}
                    className="w-full aspect-video border border-dashed border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 flex flex-col items-center justify-center gap-1.5 text-black/30 dark:text-white/30 hover:text-black/50 dark:hover:text-white/50 transition-colors"
                  >
                    <ImageIcon size={18} />
                    <span className="font-mono text-[10px] uppercase tracking-widest">Select cover</span>
                  </button>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={[
                        'font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 border transition-colors',
                        selectedTagIds.includes(tag.id)
                          ? 'border-black dark:border-white text-black dark:text-white bg-black/10 dark:bg-white/10'
                          : 'border-black/20 dark:border-white/20 text-black/30 dark:text-white/30 hover:border-black/40 dark:hover:border-white/40',
                      ].join(' ')}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="+ new tag"
                  className="font-mono text-[10px] uppercase tracking-wide text-black/40 dark:text-white/40 placeholder-black/20 dark:placeholder-white/20 bg-transparent outline-none border-b border-black/10 dark:border-white/10 focus:border-black/30 dark:focus:border-white/30 pb-0.5 w-full transition-colors"
                />
              </div>

            </div>

            {/* Word count at bottom of sidebar */}
            <div className="mt-auto border-t border-black/10 dark:border-white/10 px-4 py-2.5 flex gap-3">
              <span className="font-mono text-[10px] text-black/30 dark:text-white/30 uppercase tracking-widest">
                {wordCount} words
              </span>
              <span className="font-mono text-[10px] text-black/20 dark:text-white/20 uppercase tracking-widest">
                {content.length} chars
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer (hidden when meta sidebar is open) */}
      {!showMeta && (
        <div className="h-7 border-t border-black/10 dark:border-white/10 flex items-center px-4 gap-4 bg-[#f5f5f5] dark:bg-[#0d0d0d] shrink-0">
          <span className="font-mono text-[10px] text-black/30 dark:text-white/30 uppercase tracking-widest">
            {wordCount} words
          </span>
          <span className="font-mono text-[10px] text-black/20 dark:text-white/20 uppercase tracking-widest">
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
