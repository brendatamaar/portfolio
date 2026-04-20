import { LoaderIcon, CheckIcon } from 'lucide-react'
import { btnPrimary, btnGhost } from '../../components/form'
import type { ResumeLocale } from '../../lib/api'

export function LocaleSwitcher({
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

export function Loader() {
  return (
    <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
      Loading...
    </p>
  )
}

export function Empty() {
  return (
    <div className="px-4 py-6 text-center font-mono text-xs tracking-widest text-black/30 uppercase dark:text-white/30">
      No entries yet.
    </div>
  )
}

export function FormActions({
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
