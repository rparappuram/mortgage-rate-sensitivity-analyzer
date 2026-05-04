from __future__ import annotations

from datetime import date, datetime

import numpy as np

from services.bootstrap import interpolate_zero


def months_seasoned(origination_date: str, as_of_date: str | None = None) -> int:
    orig = datetime.strptime(origination_date, "%Y-%m-%d").date()
    asof = datetime.strptime(as_of_date, "%Y-%m-%d").date() if as_of_date else date.today()
    delta = (asof.year - orig.year) * 12 + (asof.month - orig.month)
    return max(0, delta)


def build_cashflows(
    original_balance: float,
    note_rate: float,
    loan_term_years: int,
    origination_date: str,
    cpr: float,
    as_of_date: str | None = None,
) -> tuple[list[dict], float]:
    n_total = loan_term_years * 12
    r_monthly = note_rate / 12
    payment = original_balance * r_monthly * (1 + r_monthly) ** n_total / ((1 + r_monthly) ** n_total - 1)
    seasoning = months_seasoned(origination_date, as_of_date)

    balance = original_balance
    for _ in range(min(seasoning, n_total)):
        interest = balance * r_monthly
        sched_principal = payment - interest
        smm = 1 - (1 - cpr) ** (1 / 12)
        prepay = (balance - sched_principal) * smm
        balance -= sched_principal + prepay
        if balance < 1:
            balance = 0
            break

    current_balance = balance
    remaining = n_total - seasoning
    cashflows: list[dict] = []

    for m in range(1, remaining + 1):
        if balance < 1:
            break
        interest = balance * r_monthly
        sched_principal = min(payment - interest, balance)
        smm = 1 - (1 - cpr) ** (1 / 12)
        prepay = max((balance - sched_principal) * smm, 0)
        total_principal = min(sched_principal + prepay, balance)
        cashflows.append({
            "month": m,
            "interest": round(interest, 2),
            "principal": round(sched_principal, 2),
            "prepayment": round(prepay, 2),
            "total_cf": round(interest + total_principal, 2),
            "balance": round(balance, 2),
        })
        balance -= total_principal
        if balance < 1:
            break

    return cashflows, current_balance


def price_cashflows(
    cashflows: list[dict],
    zero_rates: dict[str, float],
    shock_curve: dict[str, float] | None = None,
) -> float:
    discount_zeros = shock_curve if shock_curve else zero_rates
    pv = 0.0
    for cf in cashflows:
        t = cf["month"] / 12.0
        z = interpolate_zero(t, discount_zeros)
        df = np.exp(-z * t)
        pv += cf["total_cf"] * df
    return pv


def compute_duration_dv01(
    cashflows: list[dict],
    zero_rates: dict[str, float],
    pv: float,
    r_monthly: float,
) -> tuple[float, float, float]:
    if pv <= 0 or not cashflows:
        return 0.0, 0.0, 0.0

    weighted_time = 0.0
    for cf in cashflows:
        t = cf["month"] / 12.0
        z = interpolate_zero(t, zero_rates)
        df = np.exp(-z * t)
        weighted_time += t * cf["total_cf"] * df

    mac_duration = weighted_time / pv
    mod_duration = mac_duration / (1 + r_monthly)
    dv01 = pv * mod_duration * 0.0001
    convexity = mod_duration**2 * 0.35

    return mod_duration, dv01, convexity


def compute_wal(cashflows: list[dict], current_balance: float) -> float:
    if current_balance <= 0 or not cashflows:
        return 0.0
    total_principal = sum(cf["principal"] + cf["prepayment"] for cf in cashflows)
    if total_principal <= 0:
        return 0.0
    wal = sum((cf["month"] / 12.0) * (cf["principal"] + cf["prepayment"]) for cf in cashflows)
    return wal / total_principal


def apply_shock(
    zero_rates: dict[str, float],
    mode: str,
    parallel_bps: float = 0.0,
    short_bps: float = 0.0,
    long_bps: float = 0.0,
) -> dict[str, float]:
    from services.bootstrap import TENOR_LABELS, TENORS_YEARS

    shocked: dict[str, float] = {}
    short_cutoff = 2.0
    long_cutoff = 10.0

    for label, t in zip(TENOR_LABELS, TENORS_YEARS):
        if label not in zero_rates:
            continue
        z = zero_rates[label]

        if mode == "parallel":
            shift = parallel_bps / 10_000
        elif mode == "twist":
            if t <= short_cutoff:
                shift = short_bps / 10_000
            elif t >= long_cutoff:
                shift = long_bps / 10_000
            else:
                weight = (t - short_cutoff) / (long_cutoff - short_cutoff)
                shift = (short_bps + weight * (long_bps - short_bps)) / 10_000
        elif mode == "steepener":
            if t <= short_cutoff:
                shift = 0.0
            elif t >= long_cutoff:
                shift = long_bps / 10_000
            else:
                weight = (t - short_cutoff) / (long_cutoff - short_cutoff)
                shift = weight * long_bps / 10_000
        else:
            shift = 0.0

        shocked[label] = z + shift

    return shocked


def build_price_yield_curve(
    cashflows: list[dict],
    zero_rates: dict[str, float],
    base_pv: float,
    current_balance: float,
) -> list[dict]:
    points = []
    for shock_bps in range(-300, 325, 25):
        shifted = apply_shock(zero_rates, "parallel", parallel_bps=float(shock_bps))
        pv = price_cashflows(cashflows, zero_rates, shifted)
        price = (pv / current_balance * 100) if current_balance > 0 else 0
        points.append({"shock_bps": shock_bps, "price": round(price, 4)})
    return points


def build_scenarios(
    cashflows: list[dict],
    zero_rates: dict[str, float],
    base_pv: float,
    current_balance: float,
) -> list[dict]:
    shocks = [-200, -100, -50, 0, 50, 100, 200, 300]
    base_price = (base_pv / current_balance * 100) if current_balance > 0 else 0
    rows = []
    for bps in shocks:
        shifted = apply_shock(zero_rates, "parallel", parallel_bps=float(bps))
        pv = price_cashflows(cashflows, zero_rates, shifted)
        new_price = (pv / current_balance * 100) if current_balance > 0 else 0
        pnl_d = pv - base_pv
        pnl_p = (pnl_d / base_pv * 100) if base_pv > 0 else 0
        rows.append({
            "shock_bps": bps,
            "new_price": round(new_price, 4),
            "pnl_dollars": round(pnl_d, 2),
            "pnl_pct": round(pnl_p, 4),
        })
    return rows
