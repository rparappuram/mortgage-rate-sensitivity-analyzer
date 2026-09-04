export interface TenorRate {
  tenor: string
  years: number
  par_rate: number
  zero_rate: number
  forward_rate: number
  change_1d_bps: number | null
}

export interface TreasurySnapshot {
  as_of: string
  previous_as_of: string | null
  tenors: TenorRate[]
  spread_2s10s_bps: number | null
  inverted: boolean
}

export interface MortgageSnapshot {
  as_of: string
  rate_30y: number
  rate_15y: number | null
  change_1w_bps: number | null
  spread_vs_10y_bps: number | null
}

export interface HistoryPoint {
  date: string
  treasury_10y: number | null
  mortgage_30y: number
}

export interface MarketResponse {
  treasury: TreasurySnapshot
  mortgage: MortgageSnapshot | null
  history: HistoryPoint[]
}

export type PrepaymentModel = 'refinance_incentive' | 'constant'
export type ShockMode = 'parallel' | 'twist' | 'steepener'

export interface AnalysisRequest {
  loan: {
    original_balance: number
    current_balance: number | null
    note_rate_pct: number
    term_months: number
    origination_date: string
  }
  prepayment: {
    model: PrepaymentModel
    cpr_pct: number
  }
  valuation: {
    as_of: string | null
    spread_bps: number | null
  }
  shock: {
    mode: ShockMode
    parallel_bps: number
    short_bps: number
    long_bps: number
  }
  refinance: {
    closing_costs_pct: number
    new_term_months: number
  }
}

export interface MarketContext {
  as_of: string
  treasury_10y: number
  mortgage_rate_30y: number
  mortgage_rate_as_of: string | null
  mortgage_rate_source: 'freddie_mac' | 'estimated'
  spread_bps: number
}

export interface LoanSummary {
  monthly_payment: number
  months_seasoned: number
  months_remaining: number
  current_balance: number
  scheduled_balance: number
  balance_source: 'provided' | 'scheduled'
  maturity_date: string
  remaining_scheduled_interest: number
}

export interface ValuationSummary {
  present_value: number
  price: number
  yield_pct: number
  wal_years: number
  effective_duration: number
  convexity: number
  dv01: number
  average_cpr_pct: number
  coupon_spread_vs_10y_bps: number
  coupon_spread_vs_mortgage_bps: number
}

export interface ShockSummary {
  mode: ShockMode
  parallel_bps: number
  short_bps: number
  long_bps: number
  mortgage_rate_shift_bps: number
  present_value: number
  price: number
  price_change: number
  pnl: number
  pnl_pct: number
  linear_estimate_pnl: number
  wal_years: number
  average_cpr_pct: number
  mortgage_rate_30y: number
}

export interface CurveNode {
  tenor: string
  years: number
  base_zero_rate: number
  shocked_zero_rate: number
  base_par_rate: number
}

export interface ScenarioRow {
  shock_bps: number
  treasury_10y: number
  mortgage_rate_30y: number
  average_cpr_pct: number
  price: number
  present_value: number
  pnl: number
  pnl_pct: number
  wal_years: number
  new_loan_payment: number
}

export interface PriceCurvePoint {
  shock_bps: number
  price: number
}

export interface AnnualCashflow {
  year: number
  period_start: string
  interest: number
  scheduled_principal: number
  prepayment: number
  ending_balance: number
}

export interface MonthlyCashflow {
  month: number
  period_date: string
  starting_balance: number
  payment: number
  interest: number
  scheduled_principal: number
  prepayment: number
  ending_balance: number
  annual_cpr_pct: number
}

export interface RefinanceSummary {
  market_rate: number
  rate_advantage_bps: number
  new_term_months: number
  current_payment: number
  new_payment: number
  monthly_savings: number
  closing_costs: number
  breakeven_months: number | null
  remaining_interest_current: number
  remaining_interest_new: number
  lifetime_savings: number
}

export interface AnalysisResponse {
  market: MarketContext
  loan: LoanSummary
  valuation: ValuationSummary
  shock: ShockSummary
  curve: CurveNode[]
  scenarios: ScenarioRow[]
  price_curve: PriceCurvePoint[]
  annual_cashflows: AnnualCashflow[]
  monthly_cashflows: MonthlyCashflow[]
  refinance: RefinanceSummary
}
