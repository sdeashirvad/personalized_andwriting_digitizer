import { Shield } from 'lucide-react'
import { BRAND } from './tokens'

interface Props {
  showLabs?: boolean
  size?: 'sm' | 'md'
}

export function LabMark({ showLabs = false, size = 'md' }: Props) {
  const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const box = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${box} rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20`}>
        <Shield className={`${icon} text-white`} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
          {BRAND.product}
        </span>
        {showLabs && (
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
            by {BRAND.labs}
          </span>
        )}
      </div>
    </div>
  )
}
