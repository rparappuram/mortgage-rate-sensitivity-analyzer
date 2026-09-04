import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnalysisResponse, MarketResponse } from './api/types'
import { App } from './App'

const tenor = (label: string, years: number, rate: number) => ({
  tenor: label,
  years,
  par_rate: rate,
  zero_rate: rate,
  forward_rate: rate,
  change_1d_bps: 1,
})

const market: MarketResponse = {
  treasury: {
    as_of: '2026-09-04',
    previous_as_of: '2026-09-03',
    tenors: [tenor('2Y', 2, 4.37), tenor('10Y', 10, 4.78), tenor('30Y', 30, 5.24)],
    spread_2s10s_bps: 41,
    inverted: false,
  },
  mortgage: { as_of: '2026-09-03', rate_30y: 6.71, rate_15y: 6.04, change_1w_bps: 5, spread_vs_10y_bps: 193 },
  history: [{ date: '2026-09-03', treasury_10y: 4.77, mortgage_30y: 6.71 }],
}

const analysis: AnalysisResponse = {
  market: { as_of: '2026-09-04', treasury_10y: 4.78, mortgage_rate_30y: 6.71, mortgage_rate_as_of: '2026-09-03', mortgage_rate_source: 'freddie_mac', spread_bps: 193 },
  loan: {
    monthly_payment: 2528.27,
    months_seasoned: 36,
    months_remaining: 324,
    current_balance: 385668.97,
    scheduled_balance: 385668.97,
    balance_source: 'scheduled',
    maturity_date: '2053-09-01',
    remaining_scheduled_interest: 433490,
  },
  valuation: {
    present_value: 386000,
    price: 100.09,
    yield_pct: 6.48,
    wal_years: 5.2,
    effective_duration: 4.1,
    convexity: -1.4,
    dv01: 158,
    average_cpr_pct: 8.1,
    coupon_spread_vs_10y_bps: 172,
    coupon_spread_vs_mortgage_bps: -21,
  },
  shock: {
    mode: 'parallel',
    parallel_bps: 0,
    short_bps: 0,
    long_bps: 0,
    mortgage_rate_shift_bps: 0,
    present_value: 386000,
    price: 100.09,
    price_change: 0,
    pnl: 0,
    pnl_pct: 0,
    linear_estimate_pnl: 0,
    wal_years: 5.2,
    average_cpr_pct: 8.1,
    mortgage_rate_30y: 6.71,
  },
  curve: [{ tenor: '10Y', years: 10, base_zero_rate: 4.82, shocked_zero_rate: 4.82, base_par_rate: 4.78 }],
  scenarios: [{ shock_bps: 0, treasury_10y: 4.78, mortgage_rate_30y: 6.71, average_cpr_pct: 8.1, price: 100.09, present_value: 386000, pnl: 0, pnl_pct: 0, wal_years: 5.2, new_loan_payment: 2492 }],
  price_curve: [{ shock_bps: 0, price: 100.09 }],
  annual_cashflows: [{ year: 1, period_start: '2026-10-01', interest: 24000, scheduled_principal: 6000, prepayment: 30000, ending_balance: 349000 }],
  monthly_cashflows: [{ month: 1, period_date: '2026-10-01', starting_balance: 385668.97, payment: 4600, interest: 2088, scheduled_principal: 440, prepayment: 2072, ending_balance: 383156, annual_cpr_pct: 8.1 }],
  refinance: {
    market_rate: 6.71,
    rate_advantage_bps: -21,
    new_term_months: 360,
    current_payment: 2528.27,
    new_payment: 2492,
    monthly_savings: 36,
    closing_costs: 7713,
    breakeven_months: 214,
    remaining_interest_current: 433490,
    remaining_interest_new: 511000,
    lifetime_savings: -85000,
  },
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        const body = url.endsWith('/api/market') ? market : analysis
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders live rates and the analysis', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>,
    )
    expect(await screen.findByText('30-yr mortgage', { selector: 'div' })).toBeInTheDocument()
    expect(await screen.findByText('$2,528.27')).toBeInTheDocument()
    expect(screen.getAllByText('Refinance check').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /how the numbers are made/i })).toBeInTheDocument()
  })
})
