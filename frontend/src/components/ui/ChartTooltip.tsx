interface TooltipRow {
  label: string
  value: string
  color?: string
}

interface ChartTooltipProps {
  title: string
  rows: TooltipRow[]
}

export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  return (
    <div className="rounded-lg border border-line-strong bg-surface-3 px-3 py-2 text-xs shadow-card">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{title}</div>
      <div className="space-y-0.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              {row.color && <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: row.color }} />}
              {row.label}
            </span>
            <span className="font-mono tabular-nums text-text">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
