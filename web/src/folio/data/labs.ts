// The Labs list comes from the admin (Labs). Each row opens the live demo on labs.brendatama.dev.
import { api } from '../../lib/api'
import type { Lang } from './content'
import { copy } from './content'

export interface LabRow {
  name: string
  description: string
  href: string
}

/** Published labs in the admin's order. API down or none yet: [] (the homepage then hides the section). */
export async function loadLabs(lang: Lang): Promise<LabRow[]> {
  const t = copy[lang]
  try {
    const labs = await api.getLabs()
    return labs.map((l) => {
      const note =
        l.status === 'wip'
          ? t.labWip
          : l.status === 'archived'
            ? t.labArchived
            : ''
      return {
        name: l.title,
        description: [l.summary, note && `(${note})`].filter(Boolean).join(' '),
        href: l.resolvedDemoUrl,
      }
    })
  } catch {
    return []
  }
}
