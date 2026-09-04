import type { AnalysisResponse } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { Metric } from '../../../components/ui/Metric'
import { toneForSign } from '../../../lib/tone'
import { formatNumber, formatPercent, formatSignedBps, formatSignedCurrency, formatSignedPercent, formatYears } from '../../../lib/format'
import { help } from '../copy'

function describeShock(analysis: AnalysisResponse): string {
  const { shock } = analysis
  if (shock.mode === 'parallel') return `Parallel ${formatSignedBps(shock.parallel_bps)}`
  if (shock.mode === 'twist') return `Twist ${formatSignedBps(shock.short_bps)} short / ${formatSignedBps(shock.long_bps)} long`
  return `Steepener ${formatSignedBps(shock.long_bps)} long end`
}

export function ShockImpactCard({ analysis }: { analysis: AnalysisResponse }) {
  const { shock, valuation } = analysis
  const applied = shock.parallel_bps !== 0 || shock.short_bps !== 0 || shock.long_bps !== 0
  return (
    <Card
      title="Shock impact"
      subtitle={applied ? `${describeShock(analysis)} · 30-yr mortgage rate moves to ${formatPercent(shock.mortgage_rate_30y)}` : 'Set a rate shock to see the change in value'}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
        <Metric label="Value change" value={formatSignedCurrency(shock.pnl)} tone={toneForSign(shock.pnl)} size="lg" />
        <Metric label="Price change" value={formatSignedPercent(shock.pnl_pct)} hint={`New price ${formatNumber(shock.price, 2)}`} tone={toneForSign(shock.pnl_pct)} size="lg" />
        <Metric
          label="Duration estimate"
          value={formatSignedCurrency(shock.linear_estimate_pnl)}
          hint={applied ? `Convexity adds ${formatSignedCurrency(shock.pnl - shock.linear_estimate_pnl)}` : 'Linear approximation'}
          info={help.linearEstimate}
        />
        <Metric
          label="Avg. life"
          value={formatYears(shock.wal_years)}
          hint={`CPR ${formatPercent(shock.average_cpr_pct, 1)} vs ${formatPercent(valuation.average_cpr_pct, 1)} base`}
          info={help.averageCpr}
        />
      </div>
    </Card>
  )
}
