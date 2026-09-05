import type { AnalysisResponse } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { Metric } from '../../../components/ui/Metric'
import { toneForSign } from '../../../lib/tone'
import { formatBps, formatCurrency, formatCurrencyCents, formatMonths, formatPercent, formatSignedCurrency } from '../../../lib/format'

export function RefinanceCard({ analysis }: { analysis: AnalysisResponse }) {
  const { refinance, market } = analysis
  const worthwhile = refinance.rate_advantage_bps > 0
  const verdict = worthwhile
    ? refinance.breakeven_months !== null && refinance.lifetime_savings > 0
      ? `Refinancing at ${formatPercent(refinance.market_rate)} pays for itself in about ${formatMonths(refinance.breakeven_months)}.`
      : `Refinancing lowers the rate, but the term reset and closing costs eat most of the benefit.`
    : `Your rate is ${formatBps(Math.abs(refinance.rate_advantage_bps))} below today's ${formatPercent(market.mortgage_rate_30y)} market rate. Refinancing would not lower it.`
  return (
    <Card
      title="Refinance check"
      subtitle={`Replace the balance with a new ${refinance.new_term_months / 12}-year loan at ${formatPercent(refinance.market_rate)}, ${formatCurrency(refinance.closing_costs)} in costs`}
    >
      <p className="mb-5 text-sm leading-relaxed text-text">{verdict}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
        <Metric label="New payment" value={formatCurrencyCents(refinance.new_payment)} hint={`Now ${formatCurrencyCents(refinance.current_payment)}`} />
        <Metric label="Monthly change" value={formatSignedCurrency(-refinance.monthly_savings)} hint={refinance.monthly_savings >= 0 ? 'Lower payment' : 'Higher payment'} tone={toneForSign(refinance.monthly_savings)} />
        <Metric
          label="Break-even"
          value={refinance.breakeven_months === null ? '—' : formatMonths(refinance.breakeven_months)}
          hint={refinance.breakeven_months === null ? 'No monthly savings' : 'To recover closing costs'}
        />
        <Metric
          label="Lifetime interest"
          value={formatSignedCurrency(-refinance.lifetime_savings)}
          hint={refinance.lifetime_savings >= 0 ? 'Saved after costs' : 'Extra paid over the new term'}
          tone={toneForSign(refinance.lifetime_savings)}
        />
      </div>
    </Card>
  )
}
