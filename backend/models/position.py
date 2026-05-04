from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


class PositionRequest(BaseModel):
    original_balance: float = Field(ge=100_000, le=5_000_000)
    note_rate: float = Field(ge=0.02, le=0.12)
    loan_term_years: Literal[10, 15, 30]
    origination_date: str
    cpr: float = Field(ge=0.0, le=0.40)
    discount_curve: Literal["zero", "par"]
    as_of_date: Optional[str] = None

    shock_mode: Literal["parallel", "twist", "steepener"] = "parallel"
    shock_parallel_bps: float = 0.0
    shock_short_bps: float = 0.0
    shock_long_bps: float = 0.0


class ScenarioRow(BaseModel):
    shock_bps: float
    new_price: float
    pnl_dollars: float
    pnl_pct: float


class PositionResponse(BaseModel):
    present_value: float
    price: float
    current_balance: float
    wal_years: float
    modified_duration: float
    dv01: float
    convexity: float
    coupon_spread_vs_10y: float

    price_change_pct: float
    dollar_pnl: float
    dv01_shock: float

    cashflows: list[dict]
    price_yield_curve: list[dict]
    shocked_curve_tenors: list[dict]

    scenarios: list[ScenarioRow]
