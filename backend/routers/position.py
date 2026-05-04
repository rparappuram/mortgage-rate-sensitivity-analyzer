from __future__ import annotations

from fastapi import APIRouter, HTTPException

from models.position import PositionRequest, PositionResponse, ScenarioRow
from services.bootstrap import bootstrap_zero_rates, interpolate_zero
from services.mortgage import (
    apply_shock,
    build_cashflows,
    build_price_yield_curve,
    build_scenarios,
    compute_duration_dv01,
    compute_wal,
    price_cashflows,
)
from services.treasury import extract_key_rates, fetch_for_date, fetch_latest

router = APIRouter(prefix="/api/position", tags=["position"])


@router.post("/analyze", response_model=PositionResponse)
async def analyze_position(req: PositionRequest):
    try:
        row = await fetch_for_date(req.as_of_date) if req.as_of_date else await fetch_latest()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    par = extract_key_rates(row)
    zero = bootstrap_zero_rates(par)

    discount_curve = zero if req.discount_curve == "zero" else {k: v for k, v in par.items()}

    cashflows, current_balance = build_cashflows(
        original_balance=req.original_balance,
        note_rate=req.note_rate,
        loan_term_years=req.loan_term_years,
        origination_date=req.origination_date,
        cpr=req.cpr,
        as_of_date=req.as_of_date,
    )

    if not cashflows or current_balance < 1:
        raise HTTPException(status_code=422, detail="Loan has no remaining cashflows.")

    base_pv = price_cashflows(cashflows, discount_curve)
    base_price = (base_pv / current_balance) * 100

    r_monthly = req.note_rate / 12
    mod_duration, dv01, convexity = compute_duration_dv01(cashflows, discount_curve, base_pv, r_monthly)
    wal = compute_wal(cashflows, current_balance)

    rate_10y = par.get("10Y", 0)
    coupon_spread = (req.note_rate - rate_10y) * 100

    shocked_zeros = apply_shock(
        zero_rates=discount_curve,
        mode=req.shock_mode,
        parallel_bps=req.shock_parallel_bps,
        short_bps=req.shock_short_bps,
        long_bps=req.shock_long_bps,
    )

    shocked_pv = price_cashflows(cashflows, discount_curve, shocked_zeros)
    shocked_price = (shocked_pv / current_balance) * 100
    price_change_pct = shocked_price - base_price
    dollar_pnl = shocked_pv - base_pv

    total_bps = (
        req.shock_parallel_bps
        if req.shock_mode == "parallel"
        else (req.shock_short_bps + req.shock_long_bps) / 2
    )
    dv01_shock = -dv01 * total_bps

    shocked_curve_tenors = _build_shocked_curve_tenors(par, discount_curve, shocked_zeros)
    price_yield = build_price_yield_curve(cashflows, discount_curve, base_pv, current_balance)
    scenario_rows_raw = build_scenarios(cashflows, discount_curve, base_pv, current_balance)
    scenarios = [ScenarioRow(**r) for r in scenario_rows_raw]

    return PositionResponse(
        present_value=round(base_pv, 2),
        price=round(base_price, 4),
        current_balance=round(current_balance, 2),
        wal_years=round(wal, 2),
        modified_duration=round(mod_duration, 4),
        dv01=round(dv01, 2),
        convexity=round(convexity, 4),
        coupon_spread_vs_10y=round(coupon_spread, 3),
        price_change_pct=round(price_change_pct, 4),
        dollar_pnl=round(dollar_pnl, 2),
        dv01_shock=round(dv01_shock, 2),
        cashflows=cashflows,
        price_yield_curve=price_yield,
        shocked_curve_tenors=shocked_curve_tenors,
        scenarios=scenarios,
    )


def _build_shocked_curve_tenors(
    par: dict[str, float],
    base_zeros: dict[str, float],
    shocked_zeros: dict[str, float],
) -> list[dict]:
    tenors = []
    for label in par:
        base_par = par.get(label)
        base_z = base_zeros.get(label)
        shocked_z = shocked_zeros.get(label)
        if base_par is not None:
            tenors.append({
                "tenor": label,
                "base_par": round(base_par * 100, 4),
                "base_zero": round((base_z or base_par) * 100, 4),
                "shocked_zero": round((shocked_z or base_z or base_par) * 100, 4),
            })
    return tenors
