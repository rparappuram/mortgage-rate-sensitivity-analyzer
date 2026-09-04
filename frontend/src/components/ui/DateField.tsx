import { useId } from 'react'
import { Field } from './Field'

interface DateFieldProps {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  info?: string
  min?: string
  max?: string
  placeholderLabel?: string
  clearable?: boolean
}

export function DateField({ label, value, onChange, info, min, max, placeholderLabel, clearable = false }: DateFieldProps) {
  const id = useId()
  return (
    <Field
      label={label}
      info={info}
      htmlFor={id}
      trailing={
        clearable && value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint transition hover:text-accent"
          >
            {placeholderLabel ?? 'Reset'}
          </button>
        ) : undefined
      }
    >
      <input
        id={id}
        type="date"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-sm text-text transition focus:border-accent focus:outline-none"
      />
      {!value && placeholderLabel && <p className="text-[11px] text-faint">{placeholderLabel}</p>}
    </Field>
  )
}
