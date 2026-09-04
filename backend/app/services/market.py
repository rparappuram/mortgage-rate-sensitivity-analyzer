import asyncio
from bisect import bisect_right
from dataclasses import dataclass
from datetime import date, timedelta

from app.data.errors import MarketDataUnavailableError
from app.data.mortgage_rates import MortgageRateClient, MortgageRateObservation
from app.data.treasury import TENOR_BY_LABEL, ParCurveObservation, TreasuryClient
from app.finance.curve import CurvePoint, ZeroCurve, continuous_to_semiannual
from app.schemas.market import HistoryPoint, MortgageSnapshot, TenorRate, TreasurySnapshot

PERCENT = 100.0
BPS_PER_PERCENT = 100.0


@dataclass(frozen=True)
class MarketSnapshot:
    treasury: ParCurveObservation
    treasury_previous: ParCurveObservation | None
    mortgage: MortgageRateObservation | None
    mortgage_previous: MortgageRateObservation | None


def build_zero_curve(observation: ParCurveObservation) -> ZeroCurve:
    points = [
        CurvePoint(label, TENOR_BY_LABEL[label].years, rate / PERCENT)
        for label, rate in observation.par_rates_pct.items()
        if label in TENOR_BY_LABEL
    ]
    if not points:
        raise MarketDataUnavailableError(
            f"Treasury observation on {observation.observed_on} has no usable tenors"
        )
    return ZeroCurve.bootstrap(points)


def tenor_rates(observation: ParCurveObservation, previous: ParCurveObservation | None) -> list[TenorRate]:
    curve = build_zero_curve(observation)
    zero_rates = continuous_to_semiannual(curve.zero_rates) * PERCENT
    forward_rates = continuous_to_semiannual(curve.forward_rates()) * PERCENT
    rates: list[TenorRate] = []
    for index, label in enumerate(curve.labels):
        par_rate = observation.par_rates_pct[label]
        previous_rate = previous.rate(label) if previous else None
        rates.append(
            TenorRate(
                tenor=label,
                years=round(float(curve.years[index]), 4),
                par_rate=par_rate,
                zero_rate=round(float(zero_rates[index]), 4),
                forward_rate=round(float(forward_rates[index]), 4),
                change_1d_bps=round((par_rate - previous_rate) * BPS_PER_PERCENT, 1)
                if previous_rate is not None
                else None,
            )
        )
    return rates


def spread_2s10s_bps(observation: ParCurveObservation) -> float | None:
    two_year, ten_year = observation.rate("2Y"), observation.rate("10Y")
    if two_year is None or ten_year is None:
        return None
    return round((ten_year - two_year) * BPS_PER_PERCENT, 1)


def treasury_snapshot(
    observation: ParCurveObservation, previous: ParCurveObservation | None
) -> TreasurySnapshot:
    spread = spread_2s10s_bps(observation)
    return TreasurySnapshot(
        as_of=observation.observed_on,
        previous_as_of=previous.observed_on if previous else None,
        tenors=tenor_rates(observation, previous),
        spread_2s10s_bps=spread,
        inverted=spread is not None and spread < 0,
    )


def mortgage_snapshot(
    observation: MortgageRateObservation | None,
    previous: MortgageRateObservation | None,
    treasury: ParCurveObservation,
) -> MortgageSnapshot | None:
    if observation is None:
        return None
    ten_year = treasury.rate("10Y")
    return MortgageSnapshot(
        as_of=observation.observed_on,
        rate_30y=observation.rate_30y_pct,
        rate_15y=observation.rate_15y_pct,
        change_1w_bps=round((observation.rate_30y_pct - previous.rate_30y_pct) * BPS_PER_PERCENT, 1)
        if previous
        else None,
        spread_vs_10y_bps=round((observation.rate_30y_pct - ten_year) * BPS_PER_PERCENT, 1)
        if ten_year is not None
        else None,
    )


class MarketDataService:
    def __init__(self, treasury: TreasuryClient, mortgage: MortgageRateClient, history_weeks: int) -> None:
        self._treasury = treasury
        self._mortgage = mortgage
        self._history_weeks = history_weeks

    async def current(self) -> MarketSnapshot:
        treasury, treasury_previous = await self._treasury.latest()
        mortgage, mortgage_previous = await self._mortgage_latest()
        return MarketSnapshot(treasury, treasury_previous, mortgage, mortgage_previous)

    async def as_of(self, target: date) -> MarketSnapshot:
        treasury = await self._treasury.on_or_before(target)
        previous = await self._treasury.on_or_before(treasury.observed_on - timedelta(days=1))
        mortgage = await self._mortgage_on_or_before(treasury.observed_on)
        return MarketSnapshot(treasury, previous, mortgage, None)

    async def history(self) -> list[HistoryPoint]:
        end = date.today()
        start = end - timedelta(weeks=self._history_weeks)
        try:
            mortgage_observations = [
                observation
                for observation in await self._mortgage.history()
                if start <= observation.observed_on <= end
            ]
        except MarketDataUnavailableError:
            return []
        treasury_observations = await self._treasury.observations_between(start - timedelta(days=10), end)
        treasury_dates = [observation.observed_on for observation in treasury_observations]
        points: list[HistoryPoint] = []
        for observation in mortgage_observations:
            index = bisect_right(treasury_dates, observation.observed_on) - 1
            ten_year = treasury_observations[index].rate("10Y") if index >= 0 else None
            points.append(
                HistoryPoint(
                    date=observation.observed_on,
                    treasury_10y=ten_year,
                    mortgage_30y=observation.rate_30y_pct,
                )
            )
        return points

    async def warm(self) -> None:
        await asyncio.gather(self.current(), self.history(), return_exceptions=True)

    async def _mortgage_latest(self) -> tuple[MortgageRateObservation | None, MortgageRateObservation | None]:
        try:
            return await self._mortgage.latest()
        except MarketDataUnavailableError:
            return None, None

    async def _mortgage_on_or_before(self, target: date) -> MortgageRateObservation | None:
        try:
            return await self._mortgage.on_or_before(target)
        except MarketDataUnavailableError:
            return None
