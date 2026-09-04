import clsx from 'clsx'

interface InfoTipProps {
  label: string
  text: string
  align?: 'left' | 'right'
}

export function InfoTip({ label, text, align = 'left' }: InfoTipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`About ${label}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line-strong font-mono text-[9px] leading-none text-faint transition hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent focus-visible:outline-none"
      >
        i
      </button>
      <span
        role="tooltip"
        className={clsx(
          'pointer-events-none absolute top-6 z-30 w-64 rounded-lg border border-line-strong bg-surface-3 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-text opacity-0 shadow-card transition group-hover:opacity-100 group-focus-within:opacity-100',
          align === 'left' ? 'left-0' : 'right-0',
        )}
      >
        {text}
      </span>
    </span>
  )
}
