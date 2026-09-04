import math

import numpy as np
import pytest

from app.data.treasury import TENOR_BY_LABEL
from app.finance.curve import COUPONS_PER_YEAR, CurvePoint, ZeroCurve, continuous_to_semiannual
from tests.conftest import SAMPLE_PAR_RATES


def sample_points() -> list[CurvePoint]:
    return [
        CurvePoint(label, TENOR_BY_LABEL[label].years, rate / 100) for label, rate in SAMPLE_PAR_RATES.items()
    ]


def par_bond_price(curve: ZeroCurve, years: float, par_rate: float) -> float:
    periods = round(years * COUPONS_PER_YEAR)
    times = np.arange(1, periods + 1) / COUPONS_PER_YEAR
    discount_factors = curve.discount_factor(times)
    return float(par_rate / COUPONS_PER_YEAR * discount_factors.sum() + discount_factors[-1])


def test_bootstrapped_curve_reprices_every_par_bond_at_par() -> None:
    curve = ZeroCurve.bootstrap(sample_points())
    for point in sample_points():
        if point.years >= 1.0:
            assert par_bond_price(curve, point.years, point.par_rate) == pytest.approx(1.0, abs=1e-9)


def test_short_tenors_are_simple_interest_zeros() -> None:
    curve = ZeroCurve.bootstrap(sample_points())
    three_month = 3 / 12
    expected = math.log1p(0.0391 * three_month) / three_month
    assert curve.zero_rate(three_month) == pytest.approx(expected)


def test_curve_interpolates_and_extrapolates_flat() -> None:
    curve = ZeroCurve.bootstrap(sample_points())
    assert curve.zero_rate(40.0) == pytest.approx(curve.zero_rate(30.0))
    between = curve.zero_rate(15.0)
    assert (
        min(curve.zero_rate(10.0), curve.zero_rate(20.0))
        <= between
        <= max(curve.zero_rate(10.0), curve.zero_rate(20.0))
    )


def test_shifted_curve_moves_all_zero_rates() -> None:
    curve = ZeroCurve.bootstrap(sample_points())
    shifted = curve.shifted(lambda years: np.full_like(years, 0.01))
    assert np.allclose(shifted.zero_rates - curve.zero_rates, 0.01)


def test_zero_rates_stay_close_to_par_rates_for_upward_sloping_curve() -> None:
    curve = ZeroCurve.bootstrap(sample_points())
    ten_year_zero = float(continuous_to_semiannual(curve.zero_rate(10.0)))
    assert ten_year_zero == pytest.approx(0.0478, abs=0.002)
    assert ten_year_zero > 0.0478


def test_forward_rates_are_consistent_with_zero_rates() -> None:
    curve = ZeroCurve.bootstrap(sample_points())
    forwards = curve.forward_rates()
    index = list(curve.labels).index("10Y")
    implied = (curve.zero_rates[index] * 10.0 - curve.zero_rates[index - 1] * 7.0) / 3.0
    assert forwards[index] == pytest.approx(implied)
