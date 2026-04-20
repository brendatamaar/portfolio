import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { api } from '../../lib/api'
import type { ResumeLocale, ResumeEducationItem } from '../../lib/api'
import type { EduDraft } from '../../types/resume'
import { Field, inputCls, textareaCls, btnPrimary } from '../../components/form'
import { Loader, Empty, FormActions, LocaleSwitcher } from './shared'

const EMPTY_EDU: EduDraft = {
  locale: 'en',
  school: '',
  degree: '',
  start: '',
  end: '',
  desc: '',
  sortOrder: 0,
}

export function EducationTab() {
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
