import clsx from 'clsx'
import type { AnalysisResponse } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { formatCurrency, formatNumber, formatPercent, formatSignedBps, formatSignedCurrency, formatSignedPercent, formatYears } from '../../../lib/format'

export function ScenarioTable({ analysis }: { analysis: AnalysisResponse }) {
  return (
    <Card
      title="Parallel shock scenarios"
      subtitle="Every column is recomputed from scratch: new curve, new mortgage rate, new prepayment speed, new cash flows"
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse font-mono text-xs tabular-nums">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.1em] text-faint">
              <th className="px-5 py-3 text-left font-normal">Shock</th>
              <th className="px-3 py-3 text-right font-normal">10-yr</th>
              <th className="px-3 py-3 text-right font-normal">30-yr mtg</th>
              <th className="px-3 py-3 text-right font-normal">CPR</th>
              <th className="px-3 py-3 text-right font-normal">Avg life</th>
              <th className="px-3 py-3 text-right font-normal">Price</th>
              <th className="px-3 py-3 text-right font-normal">Value Δ</th>
              <th className="px-3 py-3 text-right font-normal">Δ %</th>
              <th className="px-5 py-3 text-right font-normal">New-loan pmt</th>
            </tr>
          </thead>
          <tbody>
            {analysis.scenarios.map((row) => {
              const base = row.shock_bps === 0
              return (
                <tr key={row.shock_bps} className={clsx('border-t border-line', base && 'bg-accent-soft/60')}>
                  <td className={clsx('px-5 py-2.5 text-left', base ? 'text-accent' : 'text-text')}>{base ? 'Base' : formatSignedBps(row.shock_bps)}</td>
                  <td className="px-3 py-2.5 text-right text-muted">{formatPercent(row.treasury_10y)}</td>
                  <td className="px-3 py-2.5 text-right text-muted">{formatPercent(row.mortgage_rate_30y)}</td>
                  <td className="px-3 py-2.5 text-right text-muted">{formatPercent(row.average_cpr_pct, 1)}</td>
                  <td className="px-3 py-2.5 text-right text-muted">{formatYears(row.wal_years)}</td>
                  <td className="px-3 py-2.5 text-right text-text">{formatNumber(row.price, 2)}</td>
                  <td className={clsx('px-3 py-2.5 text-right', row.pnl > 0 ? 'text-positive' : row.pnl < 0 ? 'text-negative' : 'text-muted')}>{base ? '—' : formatSignedCurrency(row.pnl)}</td>
                  <td className={clsx('px-3 py-2.5 text-right', row.pnl_pct > 0 ? 'text-positive' : row.pnl_pct < 0 ? 'text-negative' : 'text-muted')}>{base ? '—' : formatSignedPercent(row.pnl_pct)}</td>
                  <td className="px-5 py-2.5 text-right text-muted">{formatCurrency(row.new_loan_payment)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
