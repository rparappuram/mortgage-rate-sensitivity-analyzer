from dataclasses import dataclass
from typing import Literal

import numpy as np

ShockMode = Literal["parallel", "twist", "steepener"]

SHORT_END_YEARS = 2.0
LONG_END_YEARS = 10.0
MORTGAGE_REFERENCE_YEARS = 10.0
BASIS_POINT = 1e-4


@dataclass(frozen=True)
class RateShock:
    mode: ShockMode = "parallel"
    parallel_bps: float = 0.0
    short_bps: float = 0.0
    long_bps: float = 0.0

    @classmethod
    def parallel(cls, bps: float) -> "RateShock":
        return cls(mode="parallel", parallel_bps=bps)

    @property
    def is_zero(self) -> bool:
        return self.parallel_bps == 0.0 and self.short_bps == 0.0 and self.long_bps == 0.0

    def shift(self, years: np.ndarray) -> np.ndarray:
        years = np.asarray(years, dtype=float)
        if self.mode == "parallel":
            return np.full_like(years, self.parallel_bps * BASIS_POINT)
        weight = np.clip((years - SHORT_END_YEARS) / (LONG_END_YEARS - SHORT_END_YEARS), 0.0, 1.0)
        if self.mode == "twist":
            return (self.short_bps + weight * (self.long_bps - self.short_bps)) * BASIS_POINT
        return weight * self.long_bps * BASIS_POINT

    def shift_at(self, years: float) -> float:
        return float(self.shift(np.array([years]))[0])

    def mortgage_rate_shift(self) -> float:
        return self.shift_at(MORTGAGE_REFERENCE_YEARS)
