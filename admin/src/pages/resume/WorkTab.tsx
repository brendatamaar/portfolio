import { useState, useEffect, useCallback } from 'react'
import { LoaderIcon, PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { api } from '../../lib/api'
import type { ResumeLocale, ResumeWorkItem } from '../../lib/api'
import type { WorkDraft } from '../../types/resume'
import {
  Field,
  inputCls,
  textareaCls,
  btnPrimary,
  btnGhost,
} from '../../components/form'
import { Loader, Empty, FormActions, LocaleSwitcher } from './shared'

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

export function WorkTab() {
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
