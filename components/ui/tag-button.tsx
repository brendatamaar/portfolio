import { cn } from '@/lib/utils'
import {
  TAG_BUTTON_BASE,
  TAG_BUTTON_ACTIVE,
  TAG_BUTTON_INACTIVE,
} from '@/lib/constants'

interface TagButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

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
