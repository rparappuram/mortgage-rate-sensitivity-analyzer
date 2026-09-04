import type { AnalysisResponse } from '../../../api/types'

const HEADERS = ['month', 'date', 'starting_balance', 'payment', 'interest', 'scheduled_principal', 'prepayment', 'ending_balance', 'annual_cpr_pct']

export function cashflowsToCsv(analysis: AnalysisResponse): string {
  const rows = analysis.monthly_cashflows.map((row) =>
    [row.month, row.period_date, row.starting_balance, row.payment, row.interest, row.scheduled_principal, row.prepayment, row.ending_balance, row.annual_cpr_pct].join(','),
  )
  return [HEADERS.join(','), ...rows].join('\n')
}

export function downloadCashflows(analysis: AnalysisResponse): void {
  const blob = new Blob([cashflowsToCsv(analysis)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `mrsa-cashflows-${analysis.market.as_of}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
