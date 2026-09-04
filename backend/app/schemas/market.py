from datetime import date

from pydantic import BaseModel


class TenorRate(BaseModel):
    tenor: str
    years: float
    par_rate: float
    zero_rate: float
    forward_rate: float
    change_1d_bps: float | None


class TreasurySnapshot(BaseModel):
    as_of: date
    previous_as_of: date | None
    tenors: list[TenorRate]
    spread_2s10s_bps: float | None
    inverted: bool


class MortgageSnapshot(BaseModel):
    as_of: date
    rate_30y: float
    rate_15y: float | None
    change_1w_bps: float | None
    spread_vs_10y_bps: float | None


class HistoryPoint(BaseModel):
    date: date
    treasury_10y: float | None
    mortgage_30y: float


class MarketResponse(BaseModel):
    treasury: TreasurySnapshot
    mortgage: MortgageSnapshot | None
    history: list[HistoryPoint]


class CurveResponse(BaseModel):
    requested: date
    as_of: date
    tenors: list[TenorRate]
    spread_2s10s_bps: float | None
    inverted: bool


class HealthResponse(BaseModel):
    status: str
    version: str
    treasury_as_of: date | None
    mortgage_as_of: date | None
