import {
  useState, useEffect, useRef, useCallback, useMemo,
  type KeyboardEvent, type DragEvent, type ClipboardEvent,
} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeftIcon, SaveIcon, GlobeIcon, EyeOffIcon } from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Post, Tag } from '../lib/api.ts'
import Toolbar from '../components/Toolbar.tsx'
import Preview from '../components/Preview.tsx'
import ImageGallery from '../components/ImageGallery.tsx'

type Mode = 'split' | 'editor' | 'preview'

export default function PostEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isNew = !id

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef  = useRef<HTMLDivElement>(null)
  const isSyncing   = useRef(false)
  const saveRef     = useRef<() => void>(() => {})

  const [title, setTitle]               = useState('')
  const [slug, setSlug]                 = useState('')
  const [description, setDescription]  = useState('')
  const [content, setContent]           = useState('')
  const [status, setStatus]             = useState<'draft' | 'published'>('draft')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [allTags, setAllTags]           = useState<Tag[]>([])
  const [newTagName, setNewTagName]     = useState('')

  const [mode, setMode]                 = useState<Mode>('split')
  const [syncScroll, setSyncScroll]     = useState(false)
  const [showGallery, setShowGallery]   = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saveMsg, setSaveMsg]           = useState('')
  const [loading, setLoading]           = useState(!isNew)

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Loading...</p>
      </div>
    )
  }

  const editorVisible  = mode === 'split' || mode === 'editor'
  const previewVisible = mode === 'split' || mode === 'preview'

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Top nav */}
      <header className="h-14 border-b border-white/10 flex items-center gap-4 px-4 shrink-0">
        <Link to="/" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeftIcon size={15} />
        </Link>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="bg-transparent font-black text-base uppercase tracking-tight text-white placeholder-white/20 outline-none flex-1 min-w-0"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveMsg && (
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
              {saveMsg}
            </span>
          )}

          {status === 'published' ? (
            <button
              onClick={() => save('draft')}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors disabled:opacity-50"
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
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 bg-white text-black hover:bg-white/80 transition-colors disabled:opacity-50"
          >
            <SaveIcon size={12} />
            Save
          </button>
        </div>
      </header>

      {/* Meta bar */}
      <div className="border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center gap-4 bg-[#0d0d0d] shrink-0">
        <label className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/30 shrink-0">Slug</span>
          <input
            value={slug}
            onChange={(e) => { slugTouched.current = true; setSlug(e.target.value) }}
            className="bg-transparent font-mono text-xs text-white/60 outline-none border-b border-white/10 focus:border-white/40 min-w-0 w-48 pb-0.5 transition-colors"
          />
        </label>

        <label className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/30 shrink-0">Desc</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description..."
            className="bg-transparent font-mono text-xs text-white/60 placeholder-white/20 outline-none border-b border-white/10 focus:border-white/40 flex-1 min-w-0 pb-0.5 transition-colors"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/30 shrink-0">Cover</span>
          <input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="/uploads/..."
            className="bg-transparent font-mono text-xs text-white/60 placeholder-white/20 outline-none border-b border-white/10 focus:border-white/40 w-40 pb-0.5 transition-colors"
          />
        </label>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={[
                'font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 border transition-colors',
                selectedTagIds.includes(tag.id)
                  ? 'border-white text-white bg-white/10'
                  : 'border-white/20 text-white/30 hover:border-white/40',
              ].join(' ')}
            >
              #{tag.name}
            </button>
          ))}
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="+ tag"
            className="font-mono text-[10px] uppercase tracking-wide text-white/40 placeholder-white/20 bg-transparent outline-none border-b border-white/10 focus:border-white/30 w-16 pb-0.5"
          />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        textareaRef={textareaRef}
        mode={mode}
        onModeChange={setMode}
        onImageClick={() => setShowGallery(true)}
        syncScroll={syncScroll}
        onSyncScrollChange={setSyncScroll}
      />

      {/* Editor / Preview panes */}
      <div className="flex flex-1 min-h-0 divide-x divide-white/10">
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

      {/* Footer */}
      <div className="h-7 border-t border-white/10 flex items-center px-4 gap-4 bg-[#0d0d0d] shrink-0">
        <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
          {wordCount} words
        </span>
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
          {content.length} chars
        </span>
      </div>

      {/* Image gallery modal */}
      {showGallery && (
        <ImageGallery
          onSelect={insertImageUrl}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  )
}
