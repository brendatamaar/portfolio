import { cn } from '@/lib/utils'
import {
  TAG_BUTTON_BASE,
  TAG_BUTTON_ACTIVE,
  TAG_BUTTON_INACTIVE,
} from '@/lib/constants'

import type { TagButtonProps } from './tag-button.types'

export function TagButton({ label, active, onClick }: TagButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        TAG_BUTTON_BASE,
        active ? TAG_BUTTON_ACTIVE : TAG_BUTTON_INACTIVE,
      )}
    >
      {label}
    </button>
  )
}
