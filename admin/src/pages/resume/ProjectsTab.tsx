import { useState, useEffect, useCallback } from 'react'
import { LoaderIcon, PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { api } from '../../lib/api'
import type { ResumeLocale, ResumeProjectItem } from '../../lib/api'
import type { ProjectDraft } from '../../types/resume'
import {
  Field,
  inputCls,
  textareaCls,
  btnPrimary,
  btnGhost,
} from '../../components/form'
import { Loader, Empty, FormActions, LocaleSwitcher } from './shared'

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

export function ProjectsTab() {
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
