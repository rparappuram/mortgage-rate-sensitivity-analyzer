import type { AnalysisResponse } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { Metric } from '../../../components/ui/Metric'
import { toneForSign } from '../../../lib/tone'
import { formatCurrency, formatDate, formatNumber, formatPercent, formatSignedBps, formatYears } from '../../../lib/format'
import { help } from '../copy'

export function ValuationCard({ analysis }: { analysis: AnalysisResponse }) {
  const { valuation, market } = analysis
  const priceTone = valuation.price > 100.5 ? 'positive' : valuation.price < 99.5 ? 'negative' : 'default'
  return (
    <Card
      title="Market value and rate risk"
      subtitle={`Discounted on the ${formatDate(market.as_of)} Treasury curve plus ${formatNumber(market.spread_bps, 0)} bps`}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
        <Metric label="Present value" value={formatCurrency(valuation.present_value)} info={help.presentValue} size="lg" />
        <Metric label="Price" value={formatNumber(valuation.price, 2)} hint="% of balance" info={help.price} tone={priceTone} size="lg" />
        <Metric label="Yield" value={formatPercent(valuation.yield_pct)} info={help.yield} size="lg" />
        <Metric label="Avg. life" value={formatYears(valuation.wal_years)} info={help.wal} size="lg" />
        <Metric label="Eff. duration" value={formatNumber(valuation.effective_duration, 2)} hint="% per 100 bps" info={help.duration} />
        <Metric
          label="Convexity"
          value={formatNumber(valuation.convexity, 2)}
          hint={valuation.convexity < 0 ? 'Negative: prepay risk' : 'Positive'}
          info={help.convexity}
          tone={toneForSign(valuation.convexity)}
        />
        <Metric label="DV01" value={formatCurrency(valuation.dv01)} hint="per 1 bp" info={help.dv01} />
        <Metric
          label="vs. market rate"
          value={formatSignedBps(valuation.coupon_spread_vs_mortgage_bps)}
          hint={`Note rate vs. ${formatPercent(market.mortgage_rate_30y)} 30-yr`}
          info={help.couponSpread}
          tone={toneForSign(valuation.coupon_spread_vs_mortgage_bps, true)}
        />
      </div>
    </Card>
  )
}
