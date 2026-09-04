import type { AnalysisResponse } from '../../../api/types'
import { Button } from '../../../components/ui/Button'
import { Callout } from '../../../components/ui/Callout'
import type { AnalyzerInputs } from '../state'
import { CashflowChart } from './CashflowChart'
import { CurveShockChart } from './CurveShockChart'
import { downloadCashflows } from './exportCashflows'
import { LoanSummaryCard } from './LoanSummaryCard'
import { PriceRateChart } from './PriceRateChart'
import { RefinanceCard } from './RefinanceCard'
import { ResultsSkeleton } from './ResultsSkeleton'
import { ScenarioTable } from './ScenarioTable'
import { ShockImpactCard } from './ShockImpactCard'
import { ValuationCard } from './ValuationCard'

interface ResultsPanelProps {
  analysis: AnalysisResponse | undefined
  inputs: AnalyzerInputs
  isFetching: boolean
  error: Error | null
  onRetry: () => void
}

export function ResultsPanel({ analysis, inputs, isFetching, error, onRetry }: ResultsPanelProps) {
  if (!analysis && error) {
    return (
      <Callout tone="error" title="This loan could not be analyzed" action={<Button onClick={onRetry}>Retry</Button>}>
        {error.message}
      </Callout>
    )
  }
  if (!analysis) return <ResultsSkeleton />

  const shocked = analysis.shock.parallel_bps !== 0 || analysis.shock.short_bps !== 0 || analysis.shock.long_bps !== 0
  const parallelShock = analysis.shock.mode === 'parallel' && shocked ? analysis.shock.parallel_bps : null

  return (
    <div className={isFetching ? 'space-y-4 opacity-80 transition' : 'space-y-4 transition'} aria-live="polite">
      {error && (
        <Callout tone="warning" title="Showing the last successful result">
          {error.message}
        </Callout>
      )}
      {analysis.market.mortgage_rate_source === 'estimated' && (
        <Callout tone="warning" title="Mortgage rate feed unavailable">
          The 30-year mortgage rate is estimated as the 10-year Treasury plus 170 bps until the Freddie Mac survey feed returns.
        </Callout>
      )}
      <LoanSummaryCard analysis={analysis} />
      <ValuationCard analysis={analysis} />
      <ShockImpactCard analysis={analysis} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CurveShockChart curve={analysis.curve} shocked={shocked} />
        <PriceRateChart points={analysis.price_curve} basePrice={analysis.valuation.price} shockBps={parallelShock} shockedPrice={parallelShock === null ? null : analysis.shock.price} />
      </div>
      <ScenarioTable analysis={analysis} />
      <CashflowChart
        cashflows={analysis.annual_cashflows}
        actions={
          <Button variant="subtle" onClick={() => downloadCashflows(analysis)}>
            Download monthly CSV
          </Button>
        }
      />
      <RefinanceCard analysis={analysis} />
      <p className="text-[11px] leading-relaxed text-faint">
        Prepayment model: {inputs.prepaymentModel === 'constant' ? `constant ${inputs.cprPct.toFixed(1)}% CPR` : 'rate-driven (turnover plus refinance response)'}. Valued on the{' '}
        {analysis.market.as_of} Treasury close with a {analysis.market.spread_bps.toFixed(0)} bps spread. Model output, not advice.
      </p>
    </div>
  )
}
