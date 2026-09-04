import clsx from 'clsx'
import type { MarketResponse } from '../../api/types'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatBps, formatDate, formatPercent, formatSignedBps } from '../../lib/format'

interface TileProps {
  label: string
  value: string
  change?: { value: number; suffix: string } | null
  hint: string
  tone?: 'default' | 'positive' | 'negative'
}

function Tile({ label, value, change, hint, tone = 'default' }: TileProps) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span
          className={clsx(
            'font-mono text-[24px] leading-none tabular-nums',
            tone === 'positive' && 'text-positive',
            tone === 'negative' && 'text-negative',
            tone === 'default' && 'text-text',
          )}
        >
          {value}
        </span>
        {change && change.value !== 0 && (
          <span
            className={clsx(
              'rounded-md px-1.5 py-0.5 font-mono text-[10px] tabular-nums',
              change.value > 0 ? 'bg-negative-soft text-negative' : 'bg-positive-soft text-positive',
            )}
          >
            {formatSignedBps(change.value)} {change.suffix}
          </span>
        )}
      </div>
      <div className="mt-1.5 truncate text-[11px] text-faint">{hint}</div>
    </div>
  )
}

export function RateTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-line bg-surface px-4 py-3.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-3 h-6 w-24" />
          <Skeleton className="mt-3 h-2.5 w-28" />
        </div>
      ))}
    </div>
  )
}

export function RateTiles({ market }: { market: MarketResponse }) {
  const { treasury, mortgage } = market
  const tenor = (label: string) => treasury.tenors.find((item) => item.tenor === label)
  const tenYear = tenor('10Y')
  const twoYear = tenor('2Y')
  const spread = treasury.spread_2s10s_bps

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Tile
        label="30-yr mortgage"
        value={mortgage ? formatPercent(mortgage.rate_30y) : '—'}
        change={mortgage?.change_1w_bps != null ? { value: mortgage.change_1w_bps, suffix: '1w' } : null}
        hint={mortgage ? `Freddie Mac · ${formatDate(mortgage.as_of)}` : 'Freddie Mac feed unavailable'}
      />
      <Tile
        label="15-yr mortgage"
        value={mortgage?.rate_15y != null ? formatPercent(mortgage.rate_15y) : '—'}
        hint={mortgage ? `Freddie Mac · ${formatDate(mortgage.as_of)}` : 'Freddie Mac feed unavailable'}
      />
      <Tile
        label="10-yr Treasury"
        value={tenYear ? formatPercent(tenYear.par_rate) : '—'}
        change={tenYear?.change_1d_bps != null ? { value: tenYear.change_1d_bps, suffix: '1d' } : null}
        hint={`Par yield · ${formatDate(treasury.as_of)}`}
      />
      <Tile
        label="2-yr Treasury"
        value={twoYear ? formatPercent(twoYear.par_rate) : '—'}
        change={twoYear?.change_1d_bps != null ? { value: twoYear.change_1d_bps, suffix: '1d' } : null}
        hint={`Par yield · ${formatDate(treasury.as_of)}`}
      />
      <Tile
        label="2s10s spread"
        value={spread != null ? formatSignedBps(spread) : '—'}
        hint={treasury.inverted ? 'Curve is inverted' : 'Curve is upward sloping'}
        tone={treasury.inverted ? 'negative' : 'default'}
      />
      <Tile
        label="Mortgage spread"
        value={mortgage?.spread_vs_10y_bps != null ? formatBps(mortgage.spread_vs_10y_bps) : '—'}
        hint="30-yr mortgage over 10-yr Treasury"
      />
    </div>
  )
}
