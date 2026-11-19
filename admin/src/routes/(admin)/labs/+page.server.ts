import type { PageServerLoad } from './$types'
import { serverFetch } from '$lib/server/config'
import type { LabItem } from '$lib/types'

export const load: PageServerLoad = async ({ cookies }) => {
  try {
    return { labs: await serverFetch<LabItem[]>('/admin/labs', cookies) }
  } catch {
    return { labs: [] as LabItem[] }
  }
}
