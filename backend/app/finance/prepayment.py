import math
from dataclasses import dataclass
from typing import Protocol

MONTHS_PER_YEAR = 12
MAX_ANNUAL_CPR = 0.70


class PrepaymentModel(Protocol):
    @property
    def name(self) -> str: ...

    def annual_cpr(self, loan_age_months: int, incentive_bps: float) -> float: ...


@dataclass(frozen=True)
class ConstantPrepayment:
    cpr: float

    @property
    def name(self) -> str:
        return "constant"

    def annual_cpr(self, loan_age_months: int, incentive_bps: float) -> float:
        return min(self.cpr, MAX_ANNUAL_CPR)


@dataclass(frozen=True)
class RefinanceIncentivePrepayment:
    turnover_cpr: float = 0.06
    ramp_months: int = 30
    max_refinance_cpr: float = 0.45
    midpoint_bps: float = 100.0
    width_bps: float = 40.0

    @property
    def name(self) -> str:
        return "refinance_incentive"

    def annual_cpr(self, loan_age_months: int, incentive_bps: float) -> float:
        ramp = min(1.0, max(loan_age_months, 1) / self.ramp_months)
        refinance = self.max_refinance_cpr * _logistic((incentive_bps - self.midpoint_bps) / self.width_bps)
        return min(self.turnover_cpr * ramp + refinance, MAX_ANNUAL_CPR)


def single_monthly_mortality(annual_cpr: float) -> float:
    return 1.0 - (1.0 - annual_cpr) ** (1.0 / MONTHS_PER_YEAR)


def _logistic(value: float) -> float:
    if value >= 0:
        return 1.0 / (1.0 + math.exp(-value))
    exponent = math.exp(value)
    return exponent / (1.0 + exponent)
