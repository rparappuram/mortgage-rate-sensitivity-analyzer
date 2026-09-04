import { useId, useState } from 'react'
import { clamp } from '../../lib/format'
import { Field } from './Field'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format: (value: number) => string
  info?: string
  suffix?: string
  decimals?: number
}

export function Slider({ label, value, min, max, step, onChange, format, info, suffix, decimals = 2 }: SliderProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const fill = `${((value - min) / (max - min)) * 100}%`

  const commit = () => {
    if (draft === null) return
    const parsed = Number(draft)
    if (Number.isFinite(parsed)) onChange(Number(clamp(parsed, min, max).toFixed(decimals)))
    setDraft(null)
  }

  return (
    <Field
      label={label}
      info={info}
      htmlFor={id}
      trailing={
        <span className="flex items-center gap-1 font-mono text-xs text-text">
          <input
            aria-label={`${label} value`}
            inputMode="decimal"
            className="w-16 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-right tabular-nums transition hover:border-line-strong focus:border-accent focus:bg-surface-2 focus:outline-none"
            value={draft ?? format(value)}
            onFocus={(event) => {
              setDraft(String(value))
              event.currentTarget.select()
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') setDraft(null)
            }}
          />
          {suffix && <span className="text-faint">{suffix}</span>}
        </span>
      }
    >
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': fill } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  )
}
