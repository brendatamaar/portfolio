import { cn } from '@/lib/utils'

interface TagButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

const BASE =
  'inline-flex items-center border-2 border-black px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors dark:border-white dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'

const ACTIVE = 'border-black bg-[#FFE600] text-black dark:border-black'

const INACTIVE =
  'bg-white text-black hover:bg-[#FFE600] hover:text-black dark:bg-black dark:text-white dark:hover:border-black dark:hover:bg-[#FFE600] dark:hover:text-black'

export function TagButton({ label, active, onClick }: TagButtonProps) {
  return (
    <button onClick={onClick} className={cn(BASE, active ? ACTIVE : INACTIVE)}>
      {label}
    </button>
  )
}
