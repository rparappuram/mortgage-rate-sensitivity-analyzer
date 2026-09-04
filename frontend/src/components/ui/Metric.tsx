import clsx from 'clsx'
import type { MetricTone } from '../../lib/tone'
import { InfoTip } from './InfoTip'

interface MetricProps {
  label: string
  value: string
  hint?: string
  info?: string
  tone?: MetricTone
  size?: 'md' | 'lg'
  className?: string
}

const toneClass: Record<MetricTone, string> = {
  default: 'text-text',
  positive: 'text-positive',
  negative: 'text-negative',
  accent: 'text-accent',
  muted: 'text-muted',
}

export function Metric({ label, value, hint, info, tone = 'default', size = 'md', className }: MetricProps) {
  return (
    <div className={clsx('min-w-0', className)}>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        <span className="truncate">{label}</span>
        {info && <InfoTip label={label} text={info} />}
      </div>
      <div
        className={clsx(
          'mt-1 font-mono tabular-nums leading-none',
          size === 'lg' ? 'text-[26px]' : 'text-[19px]',
          toneClass[tone],
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1.5 truncate text-[11px] text-faint">{hint}</div>}
    </div>
  )
}
