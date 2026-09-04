from datetime import date

import pytest

from app.data.treasury import ParCurveObservation
from app.finance.loan import LoanTerms, add_months, scheduled_balance
from app.finance.prepayment import ConstantPrepayment, RefinanceIncentivePrepayment
from app.finance.shocks import RateShock
from app.finance.valuation import (
    ValuationContext,
    risk_measures,
    scenario_table,
    solve_annual_yield,
    value_under_shock,
)
from app.services.market import build_zero_curve
from tests.conftest import SAMPLE_PAR_RATES


def build_context(note_rate: float, prepayment, spread_bps: float = 190.0) -> ValuationContext:
    terms = LoanTerms(400_000.0, note_rate, 360, date(2023, 6, 1))
    curve = build_zero_curve(ParCurveObservation(date(2026, 9, 4), dict(SAMPLE_PAR_RATES)))
    return ValuationContext(
        terms=terms,
        balance=scheduled_balance(terms, 39),
        loan_age_months=39,
        months_remaining=321,
        first_period_date=add_months(terms.origination_date, 40),
        curve=curve,
        spread=spread_bps / 10_000,
        prepayment=prepayment,
        market_mortgage_rate=0.0671,
        treasury_10y_rate=0.0478,
    )


def test_loan_at_market_rate_prices_near_par() -> None:
    context = build_context(0.0671, ConstantPrepayment(0.06), spread_bps=193.0)
    base = value_under_shock(context, RateShock.parallel(0.0))
    assert base.price == pytest.approx(100.0, abs=1.5)


def test_higher_rates_lower_the_price() -> None:
    context = build_context(0.065, ConstantPrepayment(0.06))
    base = value_under_shock(context, RateShock.parallel(0.0))
    up = value_under_shock(context, RateShock.parallel(100.0))
    down = value_under_shock(context, RateShock.parallel(-100.0))
    assert down.price > base.price > up.price


def test_risk_measures_have_expected_signs_with_constant_prepayment() -> None:
    context = build_context(0.065, ConstantPrepayment(0.06))
    base = value_under_shock(context, RateShock.parallel(0.0))
    risk = risk_measures(context, base)
    assert 2.0 < risk.effective_duration < 9.0
    assert risk.convexity > 0
    assert risk.dv01 == pytest.approx(base.present_value * risk.effective_duration * 1e-4, rel=0.05)


def test_premium_loan_shows_negative_convexity_under_refinance_model() -> None:
    context = build_context(0.0775, RefinanceIncentivePrepayment())
    base = value_under_shock(context, RateShock.parallel(0.0))
    risk = risk_measures(context, base)
    assert risk.convexity < 0


def test_rate_rally_shortens_wal_under_refinance_model() -> None:
    context = build_context(0.065, RefinanceIncentivePrepayment())
    base = value_under_shock(context, RateShock.parallel(0.0))
    rally = value_under_shock(context, RateShock.parallel(-150.0))
    assert rally.wal_years < base.wal_years
    assert rally.average_cpr > base.average_cpr


def test_twist_only_moves_the_long_end() -> None:
    shock = RateShock(mode="twist", short_bps=0.0, long_bps=50.0)
    assert shock.shift_at(1.0) == pytest.approx(0.0)
    assert shock.shift_at(10.0) == pytest.approx(0.005)
    assert shock.shift_at(6.0) == pytest.approx(0.0025)
    assert shock.mortgage_rate_shift() == pytest.approx(0.005)


def test_scenario_table_is_monotonic_in_price() -> None:
    context = build_context(0.065, ConstantPrepayment(0.06))
    base = value_under_shock(context, RateShock.parallel(0.0))
    prices = [point.price for point in scenario_table(context, base)]
    assert prices == sorted(prices, reverse=True)


def test_yield_solver_recovers_the_discount_rate_for_flat_curve() -> None:
    context = build_context(0.065, ConstantPrepayment(0.0))
    base = value_under_shock(context, RateShock.parallel(0.0))
    annual_yield = solve_annual_yield(base.cashflows, base.present_value)
    assert 0.04 < annual_yield < 0.09
    at_par = solve_annual_yield(base.cashflows, context.balance)
    assert at_par == pytest.approx(0.065, abs=1e-6)
