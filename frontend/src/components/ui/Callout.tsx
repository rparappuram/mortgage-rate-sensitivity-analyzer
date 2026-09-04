import clsx from 'clsx'
import type { ReactNode } from 'react'

type CalloutTone = 'info' | 'warning' | 'error'

interface CalloutProps {
  tone?: CalloutTone
  title?: string
  children: ReactNode
  action?: ReactNode
}

const toneClasses: Record<CalloutTone, string> = {
  info: 'border-accent/30 bg-accent-soft text-text',
  warning: 'border-warning/30 bg-warning-soft text-text',
  error: 'border-negative/30 bg-negative-soft text-text',
}

export function Callout({ tone = 'info', title, children, action }: CalloutProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={clsx('flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm', toneClasses[tone])}>
      <div>
        {title && <div className="font-medium">{title}</div>}
        <div className={clsx('leading-relaxed text-muted', title && 'mt-0.5 text-xs')}>{children}</div>
      </div>
      {action}
    </div>
  )
}
