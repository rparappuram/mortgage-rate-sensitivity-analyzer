import xml.etree.ElementTree as ElementTree
from dataclasses import dataclass
from datetime import date

import httpx

from app.data.cache import AsyncTtlCache
from app.data.errors import MarketDataUnavailableError

YIELD_CURVE_URL = (
    "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml"
    "?data=daily_treasury_yield_curve&field_tdr_date_value={year}"
)
DATA_NAMESPACE = "{http://schemas.microsoft.com/ado/2007/08/dataservices}"
METADATA_NAMESPACE = "{http://schemas.microsoft.com/ado/2007/08/dataservices/metadata}"


@dataclass(frozen=True)
class Tenor:
    label: str
    field: str
    years: float


TENORS: tuple[Tenor, ...] = (
    Tenor("1M", "BC_1MONTH", 1 / 12),
    Tenor("2M", "BC_2MONTH", 2 / 12),
    Tenor("3M", "BC_3MONTH", 3 / 12),
    Tenor("4M", "BC_4MONTH", 4 / 12),
    Tenor("6M", "BC_6MONTH", 0.5),
    Tenor("1Y", "BC_1YEAR", 1.0),
    Tenor("2Y", "BC_2YEAR", 2.0),
    Tenor("3Y", "BC_3YEAR", 3.0),
    Tenor("5Y", "BC_5YEAR", 5.0),
    Tenor("7Y", "BC_7YEAR", 7.0),
    Tenor("10Y", "BC_10YEAR", 10.0),
    Tenor("20Y", "BC_20YEAR", 20.0),
    Tenor("30Y", "BC_30YEAR", 30.0),
)
TENOR_BY_LABEL = {tenor.label: tenor for tenor in TENORS}


@dataclass(frozen=True)
class ParCurveObservation:
    observed_on: date
    par_rates_pct: dict[str, float]

    def rate(self, label: str) -> float | None:
        return self.par_rates_pct.get(label)


def parse_yield_curve_xml(xml_text: str) -> list[ParCurveObservation]:
    root = ElementTree.fromstring(xml_text)
    observations: list[ParCurveObservation] = []
    for properties in root.iter(f"{METADATA_NAMESPACE}properties"):
        date_element = properties.find(f"{DATA_NAMESPACE}NEW_DATE")
        if date_element is None or not date_element.text:
            continue
        rates: dict[str, float] = {}
        for tenor in TENORS:
            element = properties.find(f"{DATA_NAMESPACE}{tenor.field}")
            if element is not None and element.text:
                rates[tenor.label] = float(element.text)
        if rates:
            observations.append(ParCurveObservation(date.fromisoformat(date_element.text[:10]), rates))
    observations.sort(key=lambda observation: observation.observed_on)
    return observations


class TreasuryClient:
    def __init__(
        self,
        http: httpx.AsyncClient,
        cache: AsyncTtlCache,
        current_year_ttl_seconds: float,
        past_year_ttl_seconds: float,
    ) -> None:
        self._http = http
        self._cache = cache
        self._current_year_ttl = current_year_ttl_seconds
        self._past_year_ttl = past_year_ttl_seconds

    async def observations_for_year(self, year: int) -> list[ParCurveObservation]:
        ttl = self._current_year_ttl if year >= date.today().year else self._past_year_ttl
        return await self._cache.get_or_fetch(f"treasury:{year}", ttl, lambda: self._download_year(year))

    async def latest(self) -> tuple[ParCurveObservation, ParCurveObservation | None]:
        today = date.today()
        observations = await self.observations_for_year(today.year)
        if len(observations) < 2:
            observations = await self.observations_for_year(today.year - 1) + observations
        if not observations:
            raise MarketDataUnavailableError("No Treasury yield curve observations are available")
        previous = observations[-2] if len(observations) >= 2 else None
        return observations[-1], previous

    async def on_or_before(self, target: date) -> ParCurveObservation:
        for year in (target.year, target.year - 1):
            observations = await self.observations_for_year(year)
            eligible = [observation for observation in observations if observation.observed_on <= target]
            if eligible:
                return eligible[-1]
        raise MarketDataUnavailableError(
            f"No Treasury yield curve observations on or before {target.isoformat()}"
        )

    async def observations_between(self, start: date, end: date) -> list[ParCurveObservation]:
        observations: list[ParCurveObservation] = []
        for year in range(start.year, end.year + 1):
            observations.extend(await self.observations_for_year(year))
        return [observation for observation in observations if start <= observation.observed_on <= end]

    async def _download_year(self, year: int) -> list[ParCurveObservation]:
        try:
            response = await self._http.get(YIELD_CURVE_URL.format(year=year))
            response.raise_for_status()
        except httpx.HTTPError as error:
            raise MarketDataUnavailableError(
                f"Treasury yield curve feed is unavailable for {year}"
            ) from error
        return parse_yield_curve_xml(response.text)
