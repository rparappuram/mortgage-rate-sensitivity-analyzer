from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class LoanInput(BaseModel):
    original_balance: float = Field(gt=0, le=100_000_000)
    current_balance: float | None = Field(default=None, gt=0, le=100_000_000)
    note_rate_pct: float = Field(gt=0, le=25)
    term_months: int = Field(ge=12, le=480)
    origination_date: date

    @model_validator(mode="after")
    def current_balance_within_original(self) -> "LoanInput":
        if self.current_balance is not None and self.current_balance > self.original_balance:
            raise ValueError("current_balance cannot exceed original_balance")
        return self


class PrepaymentInput(BaseModel):
    model: Literal["refinance_incentive", "constant"] = "refinance_incentive"
    cpr_pct: float = Field(default=6.0, ge=0, le=70)


class ValuationInput(BaseModel):
    as_of: date | None = None
    spread_bps: float | None = Field(default=None, ge=-300, le=1000)


class ShockInput(BaseModel):
    mode: Literal["parallel", "twist", "steepener"] = "parallel"
    parallel_bps: float = Field(default=0, ge=-500, le=500)
    short_bps: float = Field(default=0, ge=-500, le=500)
    long_bps: float = Field(default=0, ge=-500, le=500)


class RefinanceInput(BaseModel):
    closing_costs_pct: float = Field(default=2.0, ge=0, le=10)
    new_term_months: int = Field(default=360, ge=12, le=480)


class AnalysisRequest(BaseModel):
    loan: LoanInput
    prepayment: PrepaymentInput = PrepaymentInput()
    valuation: ValuationInput = ValuationInput()
    shock: ShockInput = ShockInput()
    refinance: RefinanceInput = RefinanceInput()


class MarketContext(BaseModel):
    as_of: date
    treasury_10y: float
    mortgage_rate_30y: float
    mortgage_rate_as_of: date | None
    mortgage_rate_source: Literal["freddie_mac", "estimated"]
    spread_bps: float


class LoanSummary(BaseModel):
    monthly_payment: float
    months_seasoned: int
    months_remaining: int
    current_balance: float
    scheduled_balance: float
    balance_source: Literal["provided", "scheduled"]
    maturity_date: date
    remaining_scheduled_interest: float


class ValuationSummary(BaseModel):
    present_value: float
    price: float
    yield_pct: float
    wal_years: float
    effective_duration: float
    convexity: float
    dv01: float
    average_cpr_pct: float
    coupon_spread_vs_10y_bps: float
    coupon_spread_vs_mortgage_bps: float


class ShockSummary(BaseModel):
    mode: Literal["parallel", "twist", "steepener"]
    parallel_bps: float
    short_bps: float
    long_bps: float
    mortgage_rate_shift_bps: float
    present_value: float
    price: float
    price_change: float
    pnl: float
    pnl_pct: float
    linear_estimate_pnl: float
    wal_years: float
    average_cpr_pct: float
    mortgage_rate_30y: float


class CurveNode(BaseModel):
    tenor: str
    years: float
    base_zero_rate: float
    shocked_zero_rate: float
    base_par_rate: float


class ScenarioRow(BaseModel):
    shock_bps: float
    treasury_10y: float
    mortgage_rate_30y: float
    average_cpr_pct: float
    price: float
    present_value: float
    pnl: float
    pnl_pct: float
    wal_years: float
    new_loan_payment: float


class PriceCurvePoint(BaseModel):
    shock_bps: float
    price: float


class AnnualCashflow(BaseModel):
    year: int
    period_start: date
    interest: float
    scheduled_principal: float
    prepayment: float
    ending_balance: float


class MonthlyCashflow(BaseModel):
    month: int
    period_date: date
    starting_balance: float
    payment: float
    interest: float
    scheduled_principal: float
    prepayment: float
    ending_balance: float
    annual_cpr_pct: float


class RefinanceSummary(BaseModel):
    market_rate: float
    rate_advantage_bps: float
    new_term_months: int
    current_payment: float
    new_payment: float
    monthly_savings: float
    closing_costs: float
    breakeven_months: float | None
    remaining_interest_current: float
    remaining_interest_new: float
    lifetime_savings: float


class AnalysisResponse(BaseModel):
    market: MarketContext
    loan: LoanSummary
    valuation: ValuationSummary
    shock: ShockSummary
    curve: list[CurveNode]
    scenarios: list[ScenarioRow]
    price_curve: list[PriceCurvePoint]
    annual_cashflows: list[AnnualCashflow]
    monthly_cashflows: list[MonthlyCashflow]
    refinance: RefinanceSummary
