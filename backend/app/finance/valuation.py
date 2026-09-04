from dataclasses import dataclass
from datetime import date

import numpy as np

from app.finance.curve import ZeroCurve
from app.finance.loan import CashflowRow, LoanTerms, project_cashflows
from app.finance.prepayment import MONTHS_PER_YEAR, PrepaymentModel
from app.finance.shocks import BASIS_POINT, RateShock

DURATION_SHOCK_BPS = 50.0
DV01_SHOCK_BPS = 1.0
SCENARIO_SHOCKS_BPS = (-200.0, -150.0, -100.0, -50.0, -25.0, 0.0, 25.0, 50.0, 100.0, 150.0, 200.0, 300.0)
PRICE_CURVE_RANGE_BPS = (-300, 300, 25)
YIELD_SOLVER_ITERATIONS = 80


@dataclass(frozen=True)
class ValuationContext:
    terms: LoanTerms
    balance: float
    loan_age_months: int
    months_remaining: int
    first_period_date: date
    curve: ZeroCurve
    spread: float
    prepayment: PrepaymentModel
    market_mortgage_rate: float
    treasury_10y_rate: float


@dataclass(frozen=True)
class ValuationPoint:
    shock: RateShock
    present_value: float
    price: float
    wal_years: float
    average_cpr: float
    mortgage_rate: float
    treasury_10y_rate: float
    cashflows: list[CashflowRow]


@dataclass(frozen=True)
class RiskMeasures:
    effective_duration: float
    convexity: float
    dv01: float


@dataclass(frozen=True)
class ScenarioPoint:
    shock_bps: float
    price: float
    present_value: float
    pnl: float
    pnl_pct: float
    wal_years: float
    average_cpr: float
    mortgage_rate: float
    treasury_10y_rate: float


def value_under_shock(context: ValuationContext, shock: RateShock) -> ValuationPoint:
    curve = context.curve if shock.is_zero else context.curve.shifted(shock.shift)
    mortgage_rate = context.market_mortgage_rate + shock.mortgage_rate_shift()
    incentive_bps = (context.terms.note_rate - mortgage_rate) / BASIS_POINT
    rows = project_cashflows(
        terms=context.terms,
        starting_balance=context.balance,
        loan_age_months=context.loan_age_months,
        months_remaining=context.months_remaining,
        first_period_date=context.first_period_date,
        prepayment=context.prepayment,
        incentive_bps=incentive_bps,
    )
    present_value = discounted_value(rows, curve, context.spread)
    return ValuationPoint(
        shock=shock,
        present_value=present_value,
        price=present_value / context.balance * 100.0 if context.balance > 0 else 0.0,
        wal_years=weighted_average_life(rows),
        average_cpr=balance_weighted_cpr(rows),
        mortgage_rate=mortgage_rate,
        treasury_10y_rate=context.treasury_10y_rate + shock.shift_at(10.0),
        cashflows=rows,
    )


def discounted_value(rows: list[CashflowRow], curve: ZeroCurve, spread: float) -> float:
    if not rows:
        return 0.0
    times = np.array([row.month for row in rows], dtype=float) / MONTHS_PER_YEAR
    amounts = np.array([row.total for row in rows], dtype=float)
    return float(np.dot(amounts, curve.discount_factor(times, spread)))


def weighted_average_life(rows: list[CashflowRow]) -> float:
    total_principal = sum(row.principal for row in rows)
    if total_principal <= 0:
        return 0.0
    weighted = sum(row.month / MONTHS_PER_YEAR * row.principal for row in rows)
    return weighted / total_principal


def balance_weighted_cpr(rows: list[CashflowRow]) -> float:
    total_balance = sum(row.starting_balance for row in rows)
    if total_balance <= 0:
        return 0.0
    return sum(row.starting_balance * row.annual_cpr for row in rows) / total_balance


def risk_measures(context: ValuationContext, base: ValuationPoint) -> RiskMeasures:
    if base.present_value <= 0:
        return RiskMeasures(0.0, 0.0, 0.0)
    up = value_under_shock(context, RateShock.parallel(DURATION_SHOCK_BPS)).present_value
    down = value_under_shock(context, RateShock.parallel(-DURATION_SHOCK_BPS)).present_value
    shift = DURATION_SHOCK_BPS * BASIS_POINT
    duration = (down - up) / (2.0 * base.present_value * shift)
    convexity = (down + up - 2.0 * base.present_value) / (base.present_value * shift**2)
    up_1bp = value_under_shock(context, RateShock.parallel(DV01_SHOCK_BPS)).present_value
    down_1bp = value_under_shock(context, RateShock.parallel(-DV01_SHOCK_BPS)).present_value
    return RiskMeasures(effective_duration=duration, convexity=convexity, dv01=(down_1bp - up_1bp) / 2.0)


def scenario_table(context: ValuationContext, base: ValuationPoint) -> list[ScenarioPoint]:
    points: list[ScenarioPoint] = []
    for shock_bps in SCENARIO_SHOCKS_BPS:
        point = base if shock_bps == 0 else value_under_shock(context, RateShock.parallel(shock_bps))
        pnl = point.present_value - base.present_value
        points.append(
            ScenarioPoint(
                shock_bps=shock_bps,
                price=point.price,
                present_value=point.present_value,
                pnl=pnl,
                pnl_pct=pnl / base.present_value * 100.0 if base.present_value else 0.0,
                wal_years=point.wal_years,
                average_cpr=point.average_cpr,
                mortgage_rate=point.mortgage_rate,
                treasury_10y_rate=point.treasury_10y_rate,
            )
        )
    return points


def price_curve(context: ValuationContext) -> list[tuple[float, float]]:
    start, stop, step = PRICE_CURVE_RANGE_BPS
    return [
        (float(shock_bps), value_under_shock(context, RateShock.parallel(float(shock_bps))).price)
        for shock_bps in range(start, stop + step, step)
    ]


def solve_annual_yield(rows: list[CashflowRow], present_value: float) -> float:
    if not rows or present_value <= 0:
        return 0.0
    months = np.array([row.month for row in rows], dtype=float)
    amounts = np.array([row.total for row in rows], dtype=float)

    def pricing_error(monthly_rate: float) -> float:
        return float(np.sum(amounts / (1.0 + monthly_rate) ** months)) - present_value

    lower, upper = -0.05, 0.10
    for _ in range(YIELD_SOLVER_ITERATIONS):
        midpoint = 0.5 * (lower + upper)
        if pricing_error(midpoint) > 0:
            lower = midpoint
        else:
            upper = midpoint
    return 0.5 * (lower + upper) * MONTHS_PER_YEAR
