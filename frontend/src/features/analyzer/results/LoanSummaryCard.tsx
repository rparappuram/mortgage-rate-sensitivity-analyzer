import type { AnalysisResponse } from '../../../api/types'
import { Card } from '../../../components/ui/Card'
import { Metric } from '../../../components/ui/Metric'
import { formatCurrency, formatCurrencyCents, formatDate, formatMonths } from '../../../lib/format'

export function LoanSummaryCard({ analysis }: { analysis: AnalysisResponse }) {
  const { loan } = analysis
  return (
    <Card title="Loan today" subtitle={`Seasoned ${formatMonths(loan.months_seasoned)} · matures ${formatDate(loan.maturity_date)}`}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
        <Metric label="Monthly payment" value={formatCurrencyCents(loan.monthly_payment)} hint="Principal and interest" />
        <Metric
          label="Balance"
          value={formatCurrency(loan.current_balance)}
          hint={loan.balance_source === 'provided' ? `Scheduled would be ${formatCurrency(loan.scheduled_balance)}` : 'Scheduled amortization'}
        />
        <Metric label="Remaining term" value={formatMonths(loan.months_remaining)} hint={`${loan.months_remaining} payments left`} />
        <Metric label="Interest still owed" value={formatCurrency(loan.remaining_scheduled_interest)} hint="If paid as scheduled" />
      </div>
    </Card>
  )
}
