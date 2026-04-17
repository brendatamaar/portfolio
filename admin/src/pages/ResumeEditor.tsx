import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Trash2Icon,
  PlusIcon,
  LoaderIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react'
import { api } from '../lib/api.ts'
import type {
  ResumeLocale,
  ResumeProfile,
  ResumeWorkItem,
  ResumeEducationItem,
  ResumeSkillItem,
  ResumeProjectItem,
} from '../lib/api.ts'

type Section = 'profile' | 'work' | 'education' | 'skills' | 'projects'

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] font-bold tracking-widest text-black/50 uppercase dark:text-white/50">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full border border-black/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white'
const textareaCls =
  'w-full resize-y border border-black/20 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white'
const btnPrimary =
  'flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/80'
const btnGhost =
  'px-3 py-1.5 font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white'

function LocaleSwitcher({
  locale,
  onChange,
}: {
  locale: ResumeLocale
  onChange: (l: ResumeLocale) => void
}) {
  return (
    <div className="flex gap-1">
      {(['en', 'id'] as ResumeLocale[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={[
            'px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase transition-colors',
            locale === l
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white',
          ].join(' ')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const [locale, setLocale] = useState<ResumeLocale>('en')
  const [form, setForm] = useState<Partial<ResumeProfile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async (l: ResumeLocale) => {
    setLoading(true)
    try {
      const data = await api.resume.getProfile(l)
      setForm(data ?? {})
    } catch {
      setForm({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(locale)
  }, [locale, load])

  function set(key: keyof ResumeProfile, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.resume.updateProfile(locale, form)
      setSaved(true)
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader />

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center justify-between">
        <LocaleSwitcher locale={locale} onChange={setLocale} />
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? (
            <LoaderIcon size={12} className="animate-spin" />
          ) : (
            <CheckIcon size={12} />
          )}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Name">
          <input
            className={inputCls}
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>
        <Field label="Current Job">
          <input
            className={inputCls}
            value={form.currentJob ?? ''}
            onChange={(e) => set('currentJob', e.target.value)}
          />
        </Field>
        <Field label="Location">
          <input
            className={inputCls}
            value={form.location ?? ''}
            onChange={(e) => set('location', e.target.value)}
          />
        </Field>
        <Field label="Location Link">
          <input
            className={inputCls}
            value={form.locationLink ?? ''}
            onChange={(e) => set('locationLink', e.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputCls}
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
        <Field label="Tel">
          <input
            className={inputCls}
            value={form.tel ?? ''}
            onChange={(e) => set('tel', e.target.value)}
          />
        </Field>
        <Field label="Avatar URL">
          <input
            className={inputCls}
            value={form.avatarUrl ?? ''}
            onChange={(e) => set('avatarUrl', e.target.value)}
          />
        </Field>
        <Field label="Website URL">
          <input
            className={inputCls}
            value={form.personalWebsiteUrl ?? ''}
            onChange={(e) => set('personalWebsiteUrl', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={2}
          className={textareaCls}
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
        />
      </Field>
      <Field label="About">
        <textarea
          rows={2}
          className={textareaCls}
          value={form.about ?? ''}
          onChange={(e) => set('about', e.target.value)}
        />
      </Field>
      <Field label="Summary">
        <textarea
          rows={4}
          className={textareaCls}
          value={form.summary ?? ''}
          onChange={(e) => set('summary', e.target.value)}
        />
      </Field>
      <Field label="Social (JSON)">
        <textarea
          rows={5}
          className={`${textareaCls} font-mono text-xs`}
          value={form.social ?? '[]'}
          onChange={(e) => set('social', e.target.value)}
          placeholder='[{"name":"github","url":"https://github.com/..."}]'
        />
      </Field>
    </form>
  )
}

// ── Work Tab ──────────────────────────────────────────────────────────────────

type WorkDraft = Omit<ResumeWorkItem, 'id'>

const EMPTY_WORK: WorkDraft = {
  locale: 'en',
  company: '',
  link: '',
  badge: '',
  title: '',
  start: '',
  end: '',
  description: '',
  sortOrder: 0,
}

function WorkTab() {
  const [locale, setLocale] = useState<ResumeLocale>('en')
  const [items, setItems] = useState<ResumeWorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<WorkDraft>(EMPTY_WORK)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)

  const load = useCallback(async (l: ResumeLocale) => {
    setLoading(true)
    try {
      setItems(await api.resume.listWork(l))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(locale)
  }, [locale, load])

  function startAdd() {
    setDraft({ ...EMPTY_WORK, locale })
    setEditingId('new')
  }

  function startEdit(item: ResumeWorkItem) {
    setDraft({
      locale: item.locale,
      company: item.company,
      link: item.link,
      badge: item.badge,
      title: item.title,
      start: item.start,
      end: item.end,
      description: item.description,
      sortOrder: item.sortOrder,
    })
    setEditingId(item.id)
  }

  function setField(key: keyof WorkDraft, value: string | number) {
    setDraft((p) => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingId === 'new') {
        const created = await api.resume.createWork(draft)
        setItems((p) => [...p, created])
      } else if (editingId !== null) {
        const updated = await api.resume.updateWork(editingId, draft)
        setItems((p) => p.map((i) => (i.id === editingId ? updated : i)))
      }
      setEditingId(null)
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, label: string) {
    if (!confirm(`Delete "${label}"?`)) return
    await api.resume.deleteWork(id)
    setItems((p) => p.filter((i) => i.id !== id))
  }

  async function handleCopy() {
    const from: ResumeLocale = locale === 'id' ? 'en' : 'id'
    if (
      !confirm(
        `Copy all ${from.toUpperCase()} entries to ${locale.toUpperCase()}? This will overwrite existing ${locale.toUpperCase()} work entries.`,
      )
    )
      return
    setCopying(true)
    try {
      const copied = await api.resume.copyWork(from, locale)
      setItems(copied)
    } catch (err) {
      alert(`Copy failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LocaleSwitcher
          locale={locale}
          onChange={(l) => {
            setLocale(l)
            setEditingId(null)
          }}
        />
        <div className="flex gap-2">
          <button onClick={handleCopy} disabled={copying} className={btnGhost}>
            {copying ? (
              <LoaderIcon size={12} className="mr-1 inline animate-spin" />
            ) : null}
            Copy from {locale === 'id' ? 'EN' : 'ID'}
          </button>
          <button onClick={startAdd} className={btnPrimary}>
            <PlusIcon size={12} /> Add
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
          {editingId === 'new' && (
            <WorkForm
              draft={draft}
              setField={setField}
              saving={saving}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          )}
          {items.map((item) =>
            editingId === item.id ? (
              <WorkForm
                key={item.id}
                draft={draft}
                setField={setField}
                saving={saving}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {item.company}{' '}
                    <span className="font-normal text-black/50 dark:text-white/50">
                      — {item.title}
                    </span>
                  </p>
                  <p className="font-mono text-xs text-black/40 dark:text-white/40">
                    {item.start}–{item.end}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(item)}
                  className="p-1.5 text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white"
                >
                  <PencilIcon size={13} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.company)}
                  className="p-1.5 text-black/30 hover:bg-red-500 hover:text-white dark:text-white/30"
                >
                  <Trash2Icon size={13} />
                </button>
              </div>
            ),
          )}
          {items.length === 0 && editingId !== 'new' && <Empty />}
        </div>
      )}
    </div>
  )
}

function WorkForm({
  draft,
  setField,
  saving,
  onSave,
  onCancel,
}: {
  draft: WorkDraft
  setField: (k: keyof WorkDraft, v: string | number) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-3 bg-black/5 p-4 dark:bg-white/5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company">
          <input
            className={inputCls}
            value={draft.company}
            onChange={(e) => setField('company', e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            className={inputCls}
            value={draft.title}
            onChange={(e) => setField('title', e.target.value)}
          />
        </Field>
        <Field label="Start">
          <input
            className={inputCls}
            value={draft.start}
            onChange={(e) => setField('start', e.target.value)}
            placeholder="2022"
          />
        </Field>
        <Field label="End">
          <input
            className={inputCls}
            value={draft.end}
            onChange={(e) => setField('end', e.target.value)}
            placeholder="Now"
          />
        </Field>
        <Field label="Link">
          <input
            className={inputCls}
            value={draft.link}
            onChange={(e) => setField('link', e.target.value)}
          />
        </Field>
        <Field label="Sort Order">
          <input
            type="number"
            className={inputCls}
            value={draft.sortOrder}
            onChange={(e) => setField('sortOrder', Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          rows={2}
          className={textareaCls}
          value={draft.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </Field>
      <FormActions saving={saving} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}

// ── Education Tab ─────────────────────────────────────────────────────────────

type EduDraft = Omit<ResumeEducationItem, 'id'>
const EMPTY_EDU: EduDraft = {
  locale: 'en',
  school: '',
  degree: '',
  start: '',
  end: '',
  desc: '',
  sortOrder: 0,
}

function EducationTab() {
  const [locale, setLocale] = useState<ResumeLocale>('en')
  const [items, setItems] = useState<ResumeEducationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<EduDraft>(EMPTY_EDU)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (l: ResumeLocale) => {
    setLoading(true)
    try {
      setItems(await api.resume.listEducation(l))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(locale)
  }, [locale, load])

  function startAdd() {
    setDraft({ ...EMPTY_EDU, locale })
    setEditingId('new')
  }
  function startEdit(item: ResumeEducationItem) {
    setDraft({
      locale: item.locale,
      school: item.school,
      degree: item.degree,
      start: item.start,
      end: item.end,
      desc: item.desc,
      sortOrder: item.sortOrder,
    })
    setEditingId(item.id)
  }
  function setField(key: keyof EduDraft, value: string | number) {
    setDraft((p) => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingId === 'new') {
        const created = await api.resume.createEducation(draft)
        setItems((p) => [...p, created])
      } else if (editingId !== null) {
        const updated = await api.resume.updateEducation(editingId, draft)
        setItems((p) => p.map((i) => (i.id === editingId ? updated : i)))
      }
      setEditingId(null)
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, label: string) {
    if (!confirm(`Delete "${label}"?`)) return
    await api.resume.deleteEducation(id)
    setItems((p) => p.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LocaleSwitcher
          locale={locale}
          onChange={(l) => {
            setLocale(l)
            setEditingId(null)
          }}
        />
        <button onClick={startAdd} className={btnPrimary}>
          <PlusIcon size={12} /> Add
        </button>
      </div>
      {loading ? (
        <Loader />
      ) : (
        <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
          {editingId === 'new' && (
            <EduForm
              draft={draft}
              setField={setField}
              saving={saving}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          )}
          {items.map((item) =>
            editingId === item.id ? (
              <EduForm
                key={item.id}
                draft={draft}
                setField={setField}
                saving={saving}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{item.school}</p>
                  <p className="font-mono text-xs text-black/40 dark:text-white/40">
                    {item.degree} · {item.start}–{item.end}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(item)}
                  className="p-1.5 text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white"
                >
                  <PencilIcon size={13} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.school)}
                  className="p-1.5 text-black/30 hover:bg-red-500 hover:text-white dark:text-white/30"
                >
                  <Trash2Icon size={13} />
                </button>
              </div>
            ),
          )}
          {items.length === 0 && editingId !== 'new' && <Empty />}
        </div>
      )}
    </div>
  )
}

function EduForm({
  draft,
  setField,
  saving,
  onSave,
  onCancel,
}: {
  draft: EduDraft
  setField: (k: keyof EduDraft, v: string | number) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-3 bg-black/5 p-4 dark:bg-white/5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="School">
          <input
            className={inputCls}
            value={draft.school}
            onChange={(e) => setField('school', e.target.value)}
          />
        </Field>
        <Field label="Degree">
          <input
            className={inputCls}
            value={draft.degree}
            onChange={(e) => setField('degree', e.target.value)}
          />
        </Field>
        <Field label="Start">
          <input
            className={inputCls}
            value={draft.start}
            onChange={(e) => setField('start', e.target.value)}
            placeholder="2017"
          />
        </Field>
        <Field label="End">
          <input
            className={inputCls}
            value={draft.end}
            onChange={(e) => setField('end', e.target.value)}
            placeholder="2019"
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          rows={3}
          className={textareaCls}
          value={draft.desc}
          onChange={(e) => setField('desc', e.target.value)}
        />
      </Field>
      <FormActions saving={saving} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}

// ── Skills Tab ────────────────────────────────────────────────────────────────

function SkillsTab() {
  const [items, setItems] = useState<ResumeSkillItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    api.resume
      .listSkills()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      const created = await api.resume.createSkill(name, items.length)
      setItems((p) => [...p, created])
      setNewName('')
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete skill "${name}"?`)) return
    await api.resume.deleteSkill(id)
    setItems((p) => p.filter((i) => i.id !== id))
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className={`${inputCls} flex-1`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="TypeScript"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className={btnPrimary}
        >
          {adding ? (
            <LoaderIcon size={12} className="animate-spin" />
          ) : (
            <PlusIcon size={12} />
          )}
          Add
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-1 border border-black/20 px-2.5 py-1 dark:border-white/20"
          >
            <span className="font-mono text-xs">{item.name}</span>
            <button
              onClick={() => handleDelete(item.id, item.name)}
              className="ml-1 text-black/30 transition-colors hover:text-red-500 dark:text-white/30"
            >
              <XIcon size={11} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="font-mono text-xs text-black/30 dark:text-white/30">
            No skills yet.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Projects Tab ──────────────────────────────────────────────────────────────

type ProjectDraft = Omit<ResumeProjectItem, 'id'>
const EMPTY_PROJECT: ProjectDraft = {
  locale: 'en',
  title: '',
  type: 'side_project',
  company: null,
  techStack: '[]',
  description: '',
  linkLabel: null,
  linkHref: null,
  img: '',
  isFeatured: 0,
  sortOrder: 0,
}

function ProjectsTab() {
  const [locale, setLocale] = useState<ResumeLocale>('en')
  const [items, setItems] = useState<ResumeProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<ProjectDraft>(EMPTY_PROJECT)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)

  const load = useCallback(async (l: ResumeLocale) => {
    setLoading(true)
    try {
      setItems(await api.resume.listProjects(l))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(locale)
  }, [locale, load])

  function startAdd() {
    setDraft({ ...EMPTY_PROJECT, locale })
    setEditingId('new')
  }
  function startEdit(item: ResumeProjectItem) {
    setDraft({
      locale: item.locale,
      title: item.title,
      type: item.type,
      company: item.company,
      techStack: item.techStack,
      description: item.description,
      linkLabel: item.linkLabel,
      linkHref: item.linkHref,
      img: item.img,
      isFeatured: item.isFeatured,
      sortOrder: item.sortOrder,
    })
    setEditingId(item.id)
  }

  function setField(key: keyof ProjectDraft, value: string | number | null) {
    setDraft((p) => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingId === 'new') {
        const created = await api.resume.createProject(draft)
        setItems((p) => [...p, created])
      } else if (editingId !== null) {
        const updated = await api.resume.updateProject(editingId, draft)
        setItems((p) => p.map((i) => (i.id === editingId ? updated : i)))
      }
      setEditingId(null)
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await api.resume.deleteProject(id)
    setItems((p) => p.filter((i) => i.id !== id))
  }

  async function handleCopy() {
    const from: ResumeLocale = locale === 'id' ? 'en' : 'id'
    if (
      !confirm(
        `Copy all ${from.toUpperCase()} entries to ${locale.toUpperCase()}? This will overwrite existing ${locale.toUpperCase()} project entries.`,
      )
    )
      return
    setCopying(true)
    try {
      const copied = await api.resume.copyProjects(from, locale)
      setItems(copied)
    } catch (err) {
      alert(`Copy failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LocaleSwitcher
          locale={locale}
          onChange={(l) => {
            setLocale(l)
            setEditingId(null)
          }}
        />
        <div className="flex gap-2">
          <button onClick={handleCopy} disabled={copying} className={btnGhost}>
            {copying ? (
              <LoaderIcon size={12} className="mr-1 inline animate-spin" />
            ) : null}
            Copy from {locale === 'id' ? 'EN' : 'ID'}
          </button>
          <button onClick={startAdd} className={btnPrimary}>
            <PlusIcon size={12} /> Add
          </button>
        </div>
      </div>
      {loading ? (
        <Loader />
      ) : (
        <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
          {editingId === 'new' && (
            <ProjectForm
              draft={draft}
              setField={setField}
              saving={saving}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          )}
          {items.map((item) =>
            editingId === item.id ? (
              <ProjectForm
                key={item.id}
                draft={draft}
                setField={setField}
                saving={saving}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{item.title}</p>
                    <span
                      className={`px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${item.type === 'work' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'}`}
                    >
                      {item.type === 'work' ? 'work' : 'side'}
                    </span>
                    {item.isFeatured === 1 && (
                      <span className="font-mono text-[9px] font-bold text-[#FFE600]">
                        ★
                      </span>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-black/40 dark:text-white/40">
                    {item.description}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(item)}
                  className="p-1.5 text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white"
                >
                  <PencilIcon size={13} />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-1.5 text-black/30 hover:bg-red-500 hover:text-white dark:text-white/30"
                >
                  <Trash2Icon size={13} />
                </button>
              </div>
            ),
          )}
          {items.length === 0 && editingId !== 'new' && <Empty />}
        </div>
      )}
    </div>
  )
}

function ProjectForm({
  draft,
  setField,
  saving,
  onSave,
  onCancel,
}: {
  draft: ProjectDraft
  setField: (k: keyof ProjectDraft, v: string | number | null) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const [techInput, setTechInput] = useState(() => {
    try {
      return (JSON.parse(draft.techStack) as string[]).join(', ')
    } catch {
      return ''
    }
  })

  function commitTech(val: string) {
    setTechInput(val)
    const arr = val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setField('techStack', JSON.stringify(arr))
  }

  return (
    <div className="space-y-3 bg-black/5 p-4 dark:bg-white/5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title">
          <input
            className={inputCls}
            value={draft.title}
            onChange={(e) => setField('title', e.target.value)}
          />
        </Field>
        <Field label="Type">
          <select
            className={inputCls}
            value={draft.type}
            onChange={(e) =>
              setField('type', e.target.value as 'side_project' | 'work')
            }
          >
            <option value="side_project">Side Project</option>
            <option value="work">Work</option>
          </select>
        </Field>
        <Field label="Company">
          <input
            className={inputCls}
            value={draft.company ?? ''}
            onChange={(e) => setField('company', e.target.value || null)}
            placeholder="Icon Plus (work only)"
          />
        </Field>
        <Field label="Sort Order">
          <input
            type="number"
            className={inputCls}
            value={draft.sortOrder}
            onChange={(e) => setField('sortOrder', Number(e.target.value))}
          />
        </Field>
        <Field label="Link Label">
          <input
            className={inputCls}
            value={draft.linkLabel ?? ''}
            onChange={(e) => setField('linkLabel', e.target.value || null)}
          />
        </Field>
        <Field label="Link Href">
          <input
            className={inputCls}
            value={draft.linkHref ?? ''}
            onChange={(e) => setField('linkHref', e.target.value || null)}
          />
        </Field>
        <Field label="Image Path">
          <input
            className={inputCls}
            value={draft.img}
            onChange={(e) => setField('img', e.target.value)}
            placeholder="/images/project.webp"
          />
        </Field>
        <Field label="Featured">
          <select
            className={inputCls}
            value={draft.isFeatured}
            onChange={(e) => setField('isFeatured', Number(e.target.value))}
          >
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </Field>
      </div>
      <Field label="Tech Stack (comma-separated)">
        <input
          className={inputCls}
          value={techInput}
          onChange={(e) => commitTech(e.target.value)}
          placeholder="React, TypeScript, Tailwind CSS"
        />
      </Field>
      <Field label="Description">
        <textarea
          rows={3}
          className={textareaCls}
          value={draft.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </Field>
      <FormActions saving={saving} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Loader() {
  return (
    <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
      Loading...
    </p>
  )
}

function Empty() {
  return (
    <div className="px-4 py-6 text-center font-mono text-xs tracking-widest text-black/30 uppercase dark:text-white/30">
      No entries yet.
    </div>
  )
}

function FormActions({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={btnPrimary}
      >
        {saving ? (
          <LoaderIcon size={12} className="animate-spin" />
        ) : (
          <CheckIcon size={12} />
        )}
        Save
      </button>
      <button type="button" onClick={onCancel} className={btnGhost}>
        Cancel
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'work', label: 'Work' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
]

export default function ResumeEditor() {
  const [section, setSection] = useState<Section>('profile')

  return (
    <div className="min-h-screen bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
      <header className="flex h-14 items-center justify-between border-b border-black/10 px-6 dark:border-white/10">
        <span className="text-sm font-black tracking-tight uppercase">
          Portfolio CMS
        </span>
        <Link
          to="/"
          className="font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          ← Posts
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-3xl font-black tracking-tighter uppercase">
          Resume
        </h1>

        <div className="mb-6 flex items-center gap-1 border-b border-black/10 pb-0 dark:border-white/10">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={[
                '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors',
                section === s.key
                  ? 'border-black text-black dark:border-white dark:text-white'
                  : 'border-transparent text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === 'profile' && <ProfileTab />}
        {section === 'work' && <WorkTab />}
        {section === 'education' && <EducationTab />}
        {section === 'skills' && <SkillsTab />}
        {section === 'projects' && <ProjectsTab />}
      </main>
    </div>
  )
}
