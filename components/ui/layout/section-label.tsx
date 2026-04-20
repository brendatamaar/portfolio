import type { SectionLabelProps } from './section-label.types'

/** Numbered section header with bottom border. */
export function SectionLabel({ num, label }: SectionLabelProps) {
  return (
    <div className="mb-8 flex items-center gap-4 border-b-2 border-black pb-4 dark:border-white">
      <span className="font-mono text-[11px] text-black/60 dark:text-white/60">
        {num}
      </span>
      <h2 className="text-xs font-black tracking-widest text-black uppercase dark:text-white">
        {label}
      </h2>
    </div>
  )
}
