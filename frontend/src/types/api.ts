export interface TenorPoint {
  tenor: string;
  tenor_years: number;
  par_rate: number;
  zero_rate: number;
  forward_rate: number;
}

export interface RateCurveResponse {
  date: string;
  par_rates: Record<string, number>;
  zero_rates: Record<string, number>;
  spread_2y10y: number;
  is_inverted: boolean;
}

export interface CurveTableResponse {
  date: string;
  tenors: TenorPoint[];
}

export interface ScenarioRow {
  shock_bps: number;
  new_price: number;
  pnl_dollars: number;
  pnl_pct: number;
}

export interface CashflowPoint {
  month: number;
  interest: number;
  principal: number;
  prepayment: number;
  total_cf: number;
  balance: number;
}

export interface PriceYieldPoint {
  shock_bps: number;
  price: number;
}

export interface ShockedCurvePoint {
  tenor: string;
  base_par: number;
  base_zero: number;
  shocked_zero: number;
}

export interface PositionResponse {
  present_value: number;
  price: number;
  current_balance: number;
  wal_years: number;
  modified_duration: number;
  dv01: number;
  convexity: number;
  coupon_spread_vs_10y: number;

  price_change_pct: number;
  dollar_pnl: number;
  dv01_shock: number;

  cashflows: CashflowPoint[];
  price_yield_curve: PriceYieldPoint[];
  shocked_curve_tenors: ShockedCurvePoint[];

  scenarios: ScenarioRow[];
}

export interface PositionRequest {
  original_balance: number;
  note_rate: number;
  loan_term_years: 10 | 15 | 30;
  origination_date: string;
  cpr: number;
  discount_curve: 'zero' | 'par';
  as_of_date?: string;

  shock_mode: 'parallel' | 'twist' | 'steepener';
  shock_parallel_bps: number;
  shock_short_bps: number;
  shock_long_bps: number;
}
