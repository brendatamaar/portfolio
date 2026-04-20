import { useState, useEffect, useCallback } from 'react'
import { LoaderIcon, CheckIcon } from 'lucide-react'
import { api } from '../../lib/api'
import type { ResumeLocale, ResumeProfile } from '../../lib/api'
import { Field, inputCls, textareaCls, btnPrimary } from '../../components/form'
import { Loader, LocaleSwitcher } from './shared'

export function ProfileTab() {
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
