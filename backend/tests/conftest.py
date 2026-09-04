from datetime import date

import pytest

from app.data.mortgage_rates import MortgageRateObservation
from app.data.treasury import ParCurveObservation

SAMPLE_PAR_RATES = {
    "1M": 3.79,
    "2M": 3.90,
    "3M": 3.91,
    "4M": 4.00,
    "6M": 3.98,
    "1Y": 4.13,
    "2Y": 4.37,
    "3Y": 4.45,
    "5Y": 4.54,
    "7Y": 4.65,
    "10Y": 4.78,
    "20Y": 5.25,
    "30Y": 5.24,
}


@pytest.fixture
def treasury_observation() -> ParCurveObservation:
    return ParCurveObservation(date(2026, 9, 4), dict(SAMPLE_PAR_RATES))


@pytest.fixture
def previous_treasury_observation() -> ParCurveObservation:
    return ParCurveObservation(
        date(2026, 9, 3), {label: rate - 0.02 for label, rate in SAMPLE_PAR_RATES.items()}
    )


@pytest.fixture
def mortgage_observation() -> MortgageRateObservation:
    return MortgageRateObservation(date(2026, 9, 3), 6.71, 6.04)
