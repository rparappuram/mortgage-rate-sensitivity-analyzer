from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from typing import Optional

from models.rates import CurveTableResponse, RateCurveResponse, TenorPoint
from services.bootstrap import (
    TENOR_LABELS,
    TENORS_YEARS,
    bootstrap_zero_rates,
    compute_forward_rates,
)
from services.treasury import (
    extract_key_rates,
    fetch_for_date,
    fetch_latest,
)

router = APIRouter(prefix="/api/rates", tags=["rates"])


def _build_response(row: dict) -> RateCurveResponse:
    par = extract_key_rates(row)
    zero = bootstrap_zero_rates(par)

    spread_2y10y = round((par.get("10Y", 0) - par.get("2Y", 0)) * 100, 3)
    is_inverted = spread_2y10y < 0

    return RateCurveResponse(
        date=row["date"],
        par_rates={k: round(v, 6) for k, v in par.items()},
        zero_rates={k: round(v, 6) for k, v in zero.items()},
        spread_2y10y=spread_2y10y,
        is_inverted=is_inverted,
    )


def _build_curve_table(row: dict) -> CurveTableResponse:
    par = extract_key_rates(row)
    zero = bootstrap_zero_rates(par)
    fwd = compute_forward_rates(zero)

    tenors = []
    for label, t in zip(TENOR_LABELS, TENORS_YEARS):
        if label not in par:
            continue
        tenors.append(TenorPoint(
            tenor=label,
            tenor_years=t,
            par_rate=round(par[label], 6),
            zero_rate=round(zero.get(label, par[label]), 6),
            forward_rate=round(fwd.get(label, par[label]), 6),
        ))

    return CurveTableResponse(date=row["date"], tenors=tenors)


@router.get("/live", response_model=RateCurveResponse)
async def get_live_rates():
    try:
        row = await fetch_latest()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return _build_response(row)


@router.get("/historical", response_model=RateCurveResponse)
async def get_historical_rates(date: str = Query(..., description="YYYY-MM-DD")):
    try:
        row = await fetch_for_date(date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return _build_response(row)


@router.get("/curve", response_model=CurveTableResponse)
async def get_curve_table(date: Optional[str] = Query(None, description="YYYY-MM-DD")):
    try:
        row = await fetch_for_date(date) if date else await fetch_latest()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return _build_curve_table(row)
