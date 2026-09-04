from datetime import date

import pytest

from app.finance.loan import (
    LoanTerms,
    add_months,
    level_payment,
    months_elapsed,
    project_cashflows,
    scheduled_balance,
)
from app.finance.prepayment import ConstantPrepayment, RefinanceIncentivePrepayment, single_monthly_mortality

TERMS = LoanTerms(
    original_balance=400_000.0, note_rate=0.065, term_months=360, origination_date=date(2023, 6, 1)
)


def test_level_payment_matches_standard_formula() -> None:
    assert level_payment(400_000.0, 0.065, 360) == pytest.approx(2528.27, abs=0.01)


def test_zero_rate_payment_is_straight_line() -> None:
    assert level_payment(120_000.0, 0.0, 120) == pytest.approx(1000.0)


def test_add_months_clamps_to_month_end() -> None:
    assert add_months(date(2024, 1, 31), 1) == date(2024, 2, 29)
    assert add_months(date(2023, 12, 15), 12) == date(2024, 12, 15)


def test_months_elapsed_counts_whole_months_only() -> None:
    assert months_elapsed(date(2023, 6, 1), date(2026, 9, 4)) == 39
    assert months_elapsed(date(2023, 6, 15), date(2026, 9, 4)) == 38
    assert months_elapsed(date(2026, 9, 4), date(2023, 6, 1)) == 0


def test_cashflows_without_prepayment_amortize_to_zero_at_maturity() -> None:
    rows = project_cashflows(
        TERMS, TERMS.original_balance, 0, 360, date(2023, 7, 1), ConstantPrepayment(0.0), 0.0
    )
    assert len(rows) == 360
    assert rows[-1].ending_balance == pytest.approx(0.0, abs=0.01)
    assert sum(row.scheduled_principal for row in rows) == pytest.approx(TERMS.original_balance, abs=0.05)
    assert all(row.prepayment == 0.0 for row in rows)


def test_projected_balance_matches_closed_form_schedule() -> None:
    rows = project_cashflows(
        TERMS, TERMS.original_balance, 0, 360, date(2023, 7, 1), ConstantPrepayment(0.0), 0.0
    )
    assert rows[59].ending_balance == pytest.approx(scheduled_balance(TERMS, 60), abs=0.01)


def test_prepayments_retire_the_loan_early() -> None:
    rows = project_cashflows(
        TERMS, TERMS.original_balance, 0, 360, date(2023, 7, 1), ConstantPrepayment(0.20), 0.0
    )
    assert len(rows) < 360
    assert rows[-1].ending_balance == 0.0
    assert sum(row.principal for row in rows) == pytest.approx(TERMS.original_balance, abs=0.05)


def test_smm_conversion_roundtrips_to_cpr() -> None:
    smm = single_monthly_mortality(0.06)
    assert 1 - (1 - smm) ** 12 == pytest.approx(0.06)


def test_refinance_incentive_model_prepays_faster_when_rates_fall() -> None:
    model = RefinanceIncentivePrepayment()
    assert model.annual_cpr(60, 200.0) > model.annual_cpr(60, 0.0) > model.annual_cpr(60, -200.0)
    assert model.annual_cpr(1, 0.0) < model.annual_cpr(60, 0.0)
    assert model.annual_cpr(60, 1000.0) <= 0.70
