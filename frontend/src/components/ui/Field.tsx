import type { ReactNode } from 'react'
import { InfoTip } from './InfoTip'

interface FieldProps {
  label: string
  info?: string
  htmlFor?: string
  trailing?: ReactNode
  children: ReactNode
}

export function Field({ label, info, htmlFor, trailing, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          {label}
          {info && <InfoTip label={label} text={info} />}
        </label>
        {trailing}
      </div>
      {children}
    </div>
  )
}
