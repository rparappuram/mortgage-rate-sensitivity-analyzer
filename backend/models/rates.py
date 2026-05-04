from pydantic import BaseModel


class TenorPoint(BaseModel):
    tenor: str
    tenor_years: float
    par_rate: float
    zero_rate: float
    forward_rate: float


class RateCurveResponse(BaseModel):
    date: str
    par_rates: dict[str, float]
    zero_rates: dict[str, float]
    spread_2y10y: float
    is_inverted: bool


class CurveTableResponse(BaseModel):
    date: str
    tenors: list[TenorPoint]
