import math
from collections.abc import Callable, Sequence
from dataclasses import dataclass

import numpy as np

COUPONS_PER_YEAR = 2
ZERO_COUPON_MAX_YEARS = 0.5
BISECTION_LOWER = -0.05
BISECTION_UPPER = 0.60
BISECTION_ITERATIONS = 80


@dataclass(frozen=True)
class CurvePoint:
    tenor: str
    years: float
    par_rate: float


class ZeroCurve:
    def __init__(self, years: Sequence[float], zero_rates: Sequence[float], labels: Sequence[str]) -> None:
        self.years = np.asarray(years, dtype=float)
        self.zero_rates = np.asarray(zero_rates, dtype=float)
        self.labels = tuple(labels)

    @classmethod
    def bootstrap(cls, points: Sequence[CurvePoint]) -> "ZeroCurve":
        ordered = sorted(points, key=lambda point: point.years)
        years: list[float] = []
        zeros: list[float] = []
        labels: list[str] = []
        for point in ordered:
            if point.years <= ZERO_COUPON_MAX_YEARS:
                zero = math.log1p(point.par_rate * point.years) / point.years
            else:
                zero = _solve_par_bond_zero(point, years, zeros)
            years.append(point.years)
            zeros.append(zero)
            labels.append(point.tenor)
        return cls(years, zeros, labels)

    def zero_rate(self, years: np.ndarray | float) -> np.ndarray | float:
        return np.interp(years, self.years, self.zero_rates)

    def discount_factor(self, years: np.ndarray | float, spread: float = 0.0) -> np.ndarray | float:
        return np.exp(-(self.zero_rate(years) + spread) * np.asarray(years, dtype=float))

    def shifted(self, shift: Callable[[np.ndarray], np.ndarray]) -> "ZeroCurve":
        return ZeroCurve(self.years, self.zero_rates + shift(self.years), self.labels)

    def forward_rates(self) -> np.ndarray:
        forwards = np.empty_like(self.zero_rates)
        forwards[0] = self.zero_rates[0]
        for index in range(1, len(self.years)):
            span = self.years[index] - self.years[index - 1]
            forwards[index] = (
                self.zero_rates[index] * self.years[index]
                - self.zero_rates[index - 1] * self.years[index - 1]
            ) / span
        return forwards


def continuous_to_semiannual(rate: np.ndarray | float) -> np.ndarray | float:
    return COUPONS_PER_YEAR * (np.exp(np.asarray(rate, dtype=float) / COUPONS_PER_YEAR) - 1.0)


def _solve_par_bond_zero(point: CurvePoint, known_years: list[float], known_zeros: list[float]) -> float:
    coupon = point.par_rate / COUPONS_PER_YEAR
    periods = max(1, round(point.years * COUPONS_PER_YEAR))
    payment_times = np.arange(1, periods + 1) / COUPONS_PER_YEAR
    knot_years = np.array([*known_years, point.years])

    def par_pricing_error(candidate_zero: float) -> float:
        knot_zeros = np.array([*known_zeros, candidate_zero])
        zeros_at_payments = np.interp(payment_times, knot_years, knot_zeros)
        discount_factors = np.exp(-zeros_at_payments * payment_times)
        return coupon * discount_factors.sum() + discount_factors[-1] - 1.0

    lower, upper = BISECTION_LOWER, BISECTION_UPPER
    for _ in range(BISECTION_ITERATIONS):
        midpoint = 0.5 * (lower + upper)
        if par_pricing_error(midpoint) > 0:
            lower = midpoint
        else:
            upper = midpoint
    return 0.5 * (lower + upper)
