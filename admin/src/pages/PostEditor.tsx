import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useDeferredValue,
  type KeyboardEvent,
  type DragEvent,
  type ClipboardEvent,
} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  SaveIcon,
  GlobeIcon,
  EyeIcon,
  EyeOffIcon,
  SunIcon,
  MoonIcon,
  ImageIcon,
  XIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { api, ApiError } from '../lib/api.ts'
import type { Post, Tag, GlossaryEntry, BibliographyEntry } from '../lib/api.ts'
import { useImageUpload } from '../hooks/useImageUpload.ts'
import Toolbar from '../components/Toolbar.tsx'
import Preview from '../components/Preview.tsx'
import ImageGallery from '../components/ImageGallery.tsx'
import GlossaryEditor from '../components/GlossaryEditor.tsx'
import BibliographyEditor from '../components/BibliographyEditor.tsx'
import PostPreviewModalContent from '../components/PostPreviewModalContent.tsx'
import { useTheme } from '../lib/theme.ts'
import type { Mode } from '../types/editor'
import { DRAFT_AUTOSAVE_DEBOUNCE_MS } from '../lib/constants.ts'

export default function PostEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isNew = !id

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)
  const saveRef = useRef<() => void>(() => {})

  const [langTab, setLangTab] = useState<'en' | 'id'>('en')
  const [activeTab, setActiveTab] = useState<
    'content' | 'glossary' | 'bibliography'
  >('content')

  // Fingerprint of source content at the time of last translation.
  // Used to detect when source has changed since translation ("stale" indicator).
  const [idTranslatedFrom, setIdTranslatedFrom] = useState<string | null>(null)
  const [enTranslatedFrom, setEnTranslatedFrom] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [titleId, setTitleId] = useState('')
  const [descriptionId, setDescriptionId] = useState('')
  const [contentId, setContentId] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [publishedAt, setPublishedAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')

  // Glossary and Bibliography
  const [glossaryEn, setGlossaryEn] = useState<GlossaryEntry[]>([])
  const [glossaryId, setGlossaryId] = useState<GlossaryEntry[]>([])
  const [bibliographyEn, setBibliographyEn] = useState<BibliographyEntry[]>([])
  const [bibliographyId, setBibliographyId] = useState<BibliographyEntry[]>([])

  // Editor modes for glossary and bibliography tabs
  const [glossaryEditorMode, setGlossaryEditorMode] = useState<
    'form' | 'markdown'
  >('form')
  const [bibliographyEditorMode, setBibliographyEditorMode] = useState<
    'form' | 'markdown'
  >('form')

  const { isDark, toggle } = useTheme()
  const [mode, setMode] = useState<Mode>('split')
  const [syncScroll, setSyncScroll] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showCoverGallery, setShowCoverGallery] = useState(false)
  const [showPostPreview, setShowPostPreview] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [savedAgo, setSavedAgo] = useState('')
  const [loading, setLoading] = useState(!isNew)

  // Load existing post
  useEffect(() => {
    const controller = new AbortController()
    api.tags.list().then(setAllTags).catch(console.error)
    if (!isNew && id) {
      api.posts
        .get(Number(id), controller.signal)
        .then((post) => {
          setTitle(post.title)
          setSlug(post.slug)
          setDescription(post.description)
          setContent(post.content)
          setTitleId(post.titleId ?? '')
          setDescriptionId(post.descriptionId ?? '')
          setContentId(post.contentId ?? '')
          setStatus(post.status)
          setPublishedAt(
            post.publishedAt
              ? new Date(post.publishedAt).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10),
          )
          setCoverImageUrl(post.coverImageUrl ?? '')
          setSelectedTagIds(post.tags.map((t) => t.id))
          setGlossaryEn(post.glossaryEn || [])
          setGlossaryId(post.glossaryId || [])
          setBibliographyEn(post.bibliographyEn || [])
          setBibliographyId(post.bibliographyId || [])
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 0) return
          navigate('/')
        })
        .finally(() => setLoading(false))
    }
    return () => controller.abort()
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

    const scrollRatio = (el: HTMLElement) => {
      const maxScroll = el.scrollHeight - el.clientHeight
      return maxScroll > 0 ? el.scrollTop / maxScroll : 0
    }
    const syncPreviewToEditor = () => {
      pv.scrollTop = scrollRatio(ta) * (pv.scrollHeight - pv.clientHeight)
    }
    const syncEditorToPreview = () => {
      ta.scrollTop = scrollRatio(pv) * (ta.scrollHeight - ta.clientHeight)
    }

    syncPreviewToEditor()

    const onEditorScroll = () => {
      if (isSyncing.current) return
      isSyncing.current = true
      syncPreviewToEditor()
      setTimeout(() => {
        isSyncing.current = false
      }, 50)
    }
    const onPreviewScroll = () => {
      if (isSyncing.current) return
      isSyncing.current = true
      syncEditorToPreview()
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
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const sel = ta.value.slice(start, end)
        document.execCommand('insertText', false, `**${sel}**`)
        sel
          ? ta.setSelectionRange(start + 2, end + 2)
          : ta.setSelectionRange(start + 2, start + 2)
        return
      }
      if (e.key === 'i') {
        e.preventDefault()
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const sel = ta.value.slice(start, end)
        document.execCommand('insertText', false, `*${sel}*`)
        sel
          ? ta.setSelectionRange(start + 1, end + 1)
          : ta.setSelectionRange(start + 1, start + 1)
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

  const { upload: uploadImages } = useImageUpload({
    onSuccess: ({ url }, file) => {
      document.execCommand('insertText', false, `![${file.name}](${url})`)
    },
    onError: (_file, _err) => {
      setSaveMsg('Upload failed')
    },
  })

  // Drag & drop images onto editor
  const handleDrop = useCallback(
    (e: DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/'),
      )
      void uploadImages(files)
    },
    [uploadImages],
  )

  // Paste images
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.clipboardData.files).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (!files.length) return
      e.preventDefault()
      void uploadImages(files)
    },
    [uploadImages],
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
      titleId,
      descriptionId,
      contentId,
      status: toStatus ?? status,
      coverImageUrl: coverImageUrl || null,
      tagIds: selectedTagIds,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      glossaryEn,
      glossaryId: glossaryId.length > 0 ? glossaryId : null,
      bibliographyEn,
      bibliographyId: bibliographyId.length > 0 ? bibliographyId : null,
    }
    try {
      if (isNew) {
        const post = await api.posts.create(payload)
        navigate(`/posts/${post.id}`, { replace: true })
        setSaveMsg('')
        setLastSavedAt(new Date())
        localStorage.removeItem(draftKey)
        return post
      } else {
        const post = await api.posts.update(Number(id), payload)
        if (toStatus) setStatus(toStatus)
        setSaveMsg('')
        setLastSavedAt(new Date())
        localStorage.removeItem(draftKey)
        return post
      }
    } catch (err) {
      setSaveMsg('Save failed')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function makeVersion(targetLang: 'en' | 'id') {
    const sourceLang = targetLang === 'id' ? 'en' : 'id'
    const srcTitle = sourceLang === 'en' ? title : titleId
    const srcDescription = sourceLang === 'en' ? description : descriptionId
    const srcContent = sourceLang === 'en' ? content : contentId

    // Warn before silently overwriting an existing translation
    const targetHasContent =
      targetLang === 'id' ? !!(titleId || contentId) : !!(title || content)
    if (
      targetHasContent &&
      !confirm(
        `This will overwrite the existing ${targetLang.toUpperCase()} version. Continue?`,
      )
    )
      return

    setTranslating(true)
    setSaveMsg('')
    try {
      const { translatedTexts } = await api.translate(
        [srcTitle, srcDescription, srcContent],
        sourceLang,
        targetLang,
      )
      const [t, d, c] = translatedTexts
      if (targetLang === 'id') {
        setTitleId(t)
        setDescriptionId(d)
        setContentId(c)
        setIdTranslatedFrom(srcTitle + srcDescription + srcContent)
      } else {
        setTitle(t)
        setDescription(d)
        setContent(c)
        setEnTranslatedFrom(srcTitle + srcDescription + srcContent)
      }
      setLangTab(targetLang)
    } catch (err) {
      setSaveMsg('Translation failed')
      console.error(err)
    } finally {
      setTranslating(false)
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

  // Active content based on lang tab
  const activeContent = langTab === 'id' ? contentId : content
  const setActiveContent = langTab === 'id' ? setContentId : setContent

  // Deferred content for Preview — lets typing stay responsive while preview
  // renders at lower priority in the background
  const deferredContent = useDeferredValue(activeContent)

  // Autosave draft to localStorage — debounced after last change
  const draftKey = `postdraft-${id ?? 'new'}`
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = JSON.stringify({
        title,
        slug,
        description,
        content,
        titleId,
        descriptionId,
        contentId,
        coverImageUrl,
        selectedTagIds,
        glossaryEn,
        glossaryId,
        bibliographyEn,
        bibliographyId,
        savedAt: new Date().toISOString(),
      })
      localStorage.setItem(draftKey, draft)
    }, DRAFT_AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [
    draftKey,
    title,
    slug,
    description,
    content,
    titleId,
    descriptionId,
    contentId,
    coverImageUrl,
    selectedTagIds,
    glossaryEn,
    glossaryId,
    bibliographyEn,
    bibliographyId,
  ])

  // Restore draft for new posts on mount
  useEffect(() => {
    if (!isNew) return
    const raw = localStorage.getItem(draftKey)
    if (!raw) return
    try {
      const draft = JSON.parse(raw)
      if (draft.title || draft.content || draft.contentId) {
        const age = draft.savedAt
          ? Math.round((Date.now() - new Date(draft.savedAt).getTime()) / 60000)
          : null
        const label = age !== null ? ` (${age}m ago)` : ''
        if (confirm(`Restore unsaved draft${label}?`)) {
          setTitle(draft.title ?? '')
          setSlug(draft.slug ?? '')
          setDescription(draft.description ?? '')
          setContent(draft.content ?? '')
          setTitleId(draft.titleId ?? '')
          setDescriptionId(draft.descriptionId ?? '')
          setContentId(draft.contentId ?? '')
          setCoverImageUrl(draft.coverImageUrl ?? '')
          setSelectedTagIds(draft.selectedTagIds ?? [])
          setGlossaryEn(draft.glossaryEn ?? [])
          setGlossaryId(draft.glossaryId ?? [])
          setBibliographyEn(draft.bibliographyEn ?? [])
          setBibliographyId(draft.bibliographyId ?? [])
        }
      }
    } catch {
      // malformed draft — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Heading outline parsed from active content
  const headings = useMemo(
    () =>
      [...activeContent.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => ({
        level: m[1].length,
        text: m[2].trim(),
        index: m.index ?? 0,
      })),
    [activeContent],
  )

  function jumpToHeading(charIndex: number) {
    const ta = textareaRef.current
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(charIndex, charIndex)
    const linesBefore = activeContent.slice(0, charIndex).split('\n').length - 1
    const lineHeight =
      ta.scrollHeight / Math.max(activeContent.split('\n').length, 1)
    ta.scrollTop = linesBefore * lineHeight - ta.clientHeight / 3
  }

  // Keep saveRef current so handleKeyDown can call it without stale closure
  saveRef.current = () => {
    void save()
  }

  const wordCount = useMemo(
    () => (activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0),
    [activeContent],
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
  const previewTitle = langTab === 'id' ? titleId || title : title
  const previewDescription =
    langTab === 'id' ? descriptionId || description : description
  const previewDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null
  const previewTags = allTags.filter((tag) => selectedTagIds.includes(tag.id))
  const previewGlossary = langTab === 'id' ? glossaryId : glossaryEn
  const previewBibliography = langTab === 'id' ? bibliographyId : bibliographyEn

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
      {/* Top nav */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-black/10 px-4 dark:border-white/10">
        <Link
          to="/"
          aria-label="Back to posts list"
          className="shrink-0 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          <ArrowLeftIcon size={15} />
        </Link>

        {/* Language tabs */}
        <div className="flex shrink-0 gap-0.5 border border-black/10 dark:border-white/10">
          {(['en', 'id'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLangTab(l)}
              className={[
                'px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase transition-colors',
                langTab === l
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white',
              ].join(' ')}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Make version button */}
        {langTab === 'en' &&
          title &&
          (() => {
            const enSource = title + description + content
            const stale =
              idTranslatedFrom !== null && idTranslatedFrom !== enSource
            return (
              <button
                onClick={() => makeVersion('id')}
                disabled={translating}
                title={
                  stale
                    ? 'EN content changed since last translation'
                    : undefined
                }
                className="flex shrink-0 items-center gap-1 bg-[#FFE600] px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest text-black uppercase transition-colors hover:bg-yellow-300 disabled:opacity-50"
              >
                {translating ? '...' : stale ? '⚠ Make ID →' : 'Make ID →'}
              </button>
            )
          })()}
        {langTab === 'id' &&
          titleId &&
          (() => {
            const idSource = titleId + descriptionId + contentId
            const stale =
              enTranslatedFrom !== null && enTranslatedFrom !== idSource
            return (
              <button
                onClick={() => makeVersion('en')}
                disabled={translating}
                title={
                  stale
                    ? 'ID content changed since last translation'
                    : undefined
                }
                className="flex shrink-0 items-center gap-1 bg-[#FFE600] px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest text-black uppercase transition-colors hover:bg-yellow-300 disabled:opacity-50"
              >
                {translating ? '...' : stale ? '⚠ Make EN →' : 'Make EN →'}
              </button>
            )
          })()}

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <input
            value={langTab === 'id' ? titleId : title}
            onChange={(e) =>
              langTab === 'id'
                ? setTitleId(e.target.value)
                : setTitle(e.target.value)
            }
            placeholder={
              langTab === 'id' ? 'Judul tulisan... (ID)' : 'Post title...'
            }
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

          <button
            onClick={() => setShowPostPreview(true)}
            disabled={!title && !titleId}
            className="flex items-center gap-1.5 border border-black/20 px-3 py-1.5 text-xs font-bold tracking-wide text-black/60 uppercase transition-colors hover:border-black/40 hover:text-black disabled:opacity-50 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white"
          >
            <EyeIcon size={12} />
            Preview
          </button>

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

      {/* Tabs */}
      <div className="flex border-b border-black/10 dark:border-white/10">
        {(['content', 'glossary', 'bibliography'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 font-mono text-[11px] tracking-widest uppercase transition-colors',
              activeTab === tab
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white',
            ].join(' ')}
          >
            {tab === 'content' && 'Content'}
            {tab === 'glossary' &&
              `Glossary (${(langTab === 'id' ? glossaryId : glossaryEn).length})`}
            {tab === 'bibliography' &&
              `Bibliography (${(langTab === 'id' ? bibliographyId : bibliographyEn).length})`}
          </button>
        ))}
      </div>

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
          {activeTab === 'content' && editorVisible && (
            <div
              className={`flex min-h-0 flex-col ${mode === 'split' ? 'w-1/2' : 'w-full'}`}
            >
              <textarea
                ref={textareaRef}
                value={activeContent}
                onChange={(e) => setActiveContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onDrop={handleDrop}
                onPaste={handlePaste}
                spellCheck={false}
                className="editor-textarea editor-pane"
                placeholder={
                  langTab === 'id'
                    ? 'Mulai menulis dalam markdown... (ID)'
                    : 'Start writing in markdown...'
                }
              />
            </div>
          )}

          {activeTab === 'content' && previewVisible && (
            <div
              ref={previewRef}
              className={`min-h-0 overflow-y-auto ${mode === 'split' ? 'w-1/2' : 'w-full'}`}
            >
              <Preview
                markdown={deferredContent}
                fullWidth={mode === 'preview'}
              />
            </div>
          )}

          {activeTab === 'glossary' && (
            <div className="flex min-h-0 w-full flex-col overflow-y-auto p-4">
              <GlossaryEditor
                entries={langTab === 'id' ? glossaryId : glossaryEn}
                onChange={(entries) => {
                  if (langTab === 'id') {
                    setGlossaryId(entries)
                  } else {
                    setGlossaryEn(entries)
                  }
                }}
                editorMode={glossaryEditorMode}
                onEditorModeChange={setGlossaryEditorMode}
              />
            </div>
          )}

          {activeTab === 'bibliography' && (
            <div className="flex min-h-0 w-full flex-col overflow-y-auto p-4">
              <BibliographyEditor
                entries={langTab === 'id' ? bibliographyId : bibliographyEn}
                onChange={(entries) => {
                  if (langTab === 'id') {
                    setBibliographyId(entries)
                  } else {
                    setBibliographyEn(entries)
                  }
                }}
                editorMode={bibliographyEditorMode}
                onEditorModeChange={setBibliographyEditorMode}
              />
            </div>
          )}
        </div>

        {/* Meta sidebar */}
        {showMeta && (
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
                  value={langTab === 'id' ? descriptionId : description}
                  onChange={(e) =>
                    langTab === 'id'
                      ? setDescriptionId(e.target.value)
                      : setDescription(e.target.value)
                  }
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
                {activeContent.length} chars
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
            {activeContent.length} chars
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

      {showPostPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Post preview"
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowPostPreview(false)
          }}
        >
          <div className="flex w-full max-w-5xl flex-col overflow-hidden border border-black/15 bg-white text-black shadow-2xl dark:border-white/15 dark:bg-[#0a0a0a] dark:text-white">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 px-4 dark:border-white/10">
              <span className="font-mono text-[10px] tracking-widest text-black/40 uppercase dark:text-white/40">
                {langTab.toUpperCase()} Preview
              </span>
              <button
                type="button"
                onClick={() => setShowPostPreview(false)}
                className="p-1.5 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
                aria-label="Close preview"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {coverImageUrl && (
                <div className="max-h-[360px] overflow-hidden border-b border-black/10 dark:border-white/10">
                  <img
                    src={coverImageUrl}
                    alt=""
                    className="h-full max-h-[360px] w-full object-cover"
                  />
                </div>
              )}

              <div className="mx-auto max-w-3xl px-6 py-10">
                {previewTags.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {previewTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="border border-black/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-black/50 uppercase dark:border-white/20 dark:text-white/50"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="mb-4 text-5xl leading-[0.9] font-black tracking-tight text-black uppercase dark:text-white">
                  {previewTitle}
                </h1>

                {previewDescription && (
                  <p className="mb-6 text-xl leading-relaxed text-black/60 dark:text-white/60">
                    {previewDescription}
                  </p>
                )}

                <div className="flex items-center gap-3 border-b border-black/10 pb-8 font-mono text-[11px] tracking-widest text-black/30 uppercase dark:border-white/10 dark:text-white/30">
                  <span>{previewDate}</span>
                  <span>{status}</span>
                </div>
              </div>

              <PostPreviewModalContent
                markdown={activeContent}
                glossaryEntries={previewGlossary}
                bibliographyEntries={previewBibliography}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
