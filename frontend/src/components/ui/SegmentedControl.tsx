import clsx from 'clsx'

interface SegmentedOption<T extends string | number> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string | number> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  size?: 'sm' | 'md'
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'sm',
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex w-full rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'flex-1 rounded-md font-mono transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              active ? 'bg-surface-3 text-text shadow-sm' : 'text-faint hover:text-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
