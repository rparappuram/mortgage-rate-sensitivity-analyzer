import { useId, useState } from 'react'
import { clamp } from '../../lib/format'
import { Field } from './Field'

interface NumberFieldProps {
  label: string
  value: number | null
  min: number
  max: number
  onChange: (value: number | null) => void
  format: (value: number) => string
  info?: string
  prefix?: string
  suffix?: string
  placeholder?: string
  allowEmpty?: boolean
  decimals?: number
}

export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  format,
  info,
  prefix,
  suffix,
  placeholder,
  allowEmpty = false,
  decimals = 0,
}: NumberFieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    const cleaned = draft.replace(/[^0-9.-]/g, '')
    if (cleaned === '') {
      if (allowEmpty) onChange(null)
    } else {
      const parsed = Number(cleaned)
      if (Number.isFinite(parsed)) onChange(Number(clamp(parsed, min, max).toFixed(decimals)))
    }
    setDraft(null)
  }

  return (
    <Field label={label} info={info} htmlFor={id}>
      <div className="flex items-center rounded-lg border border-line bg-surface-2 px-3 transition focus-within:border-accent">
        {prefix && <span className="mr-1 font-mono text-xs text-faint">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          placeholder={placeholder}
          className="w-full bg-transparent py-2 font-mono text-sm tabular-nums text-text placeholder:text-faint focus:outline-none"
          value={draft ?? (value === null ? '' : format(value))}
          onFocus={(event) => {
            setDraft(value === null ? '' : String(value))
            event.currentTarget.select()
          }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') setDraft(null)
          }}
        />
        {suffix && <span className="ml-1 font-mono text-xs text-faint">{suffix}</span>}
      </div>
    </Field>
  )
}
