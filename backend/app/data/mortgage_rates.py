import csv
import io
from dataclasses import dataclass
from datetime import date

import httpx

from app.data.cache import AsyncTtlCache
from app.data.errors import MarketDataUnavailableError

FREDDIE_MAC_PMMS_URL = "https://www.freddiemac.com/pmms/docs/PMMS_history.csv"
FRED_SERIES_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}"
CACHE_KEY = "mortgage-rates"


@dataclass(frozen=True)
class MortgageRateObservation:
    observed_on: date
    rate_30y_pct: float
    rate_15y_pct: float | None


def parse_pmms_csv(text: str) -> list[MortgageRateObservation]:
    observations: list[MortgageRateObservation] = []
    for row in csv.DictReader(io.StringIO(text)):
        raw_date = (row.get("date") or "").strip()
        raw_30y = (row.get("pmms30") or "").strip()
        if not raw_date or not raw_30y:
            continue
        month, day, year = (int(part) for part in raw_date.split("/"))
        raw_15y = (row.get("pmms15") or "").strip()
        observations.append(
            MortgageRateObservation(
                date(year, month, day), float(raw_30y), float(raw_15y) if raw_15y else None
            )
        )
    observations.sort(key=lambda observation: observation.observed_on)
    return observations


def parse_fred_csv(text: str) -> dict[date, float]:
    values: dict[date, float] = {}
    for row in csv.reader(io.StringIO(text)):
        if len(row) < 2 or row[0] == "observation_date":
            continue
        try:
            values[date.fromisoformat(row[0])] = float(row[1])
        except ValueError:
            continue
    return values


class MortgageRateClient:
    def __init__(self, http: httpx.AsyncClient, cache: AsyncTtlCache, ttl_seconds: float) -> None:
        self._http = http
        self._cache = cache
        self._ttl = ttl_seconds

    async def history(self) -> list[MortgageRateObservation]:
        return await self._cache.get_or_fetch(CACHE_KEY, self._ttl, self._download)

    async def latest(self) -> tuple[MortgageRateObservation, MortgageRateObservation | None]:
        observations = await self.history()
        if not observations:
            raise MarketDataUnavailableError("No mortgage rate observations are available")
        previous = observations[-2] if len(observations) >= 2 else None
        return observations[-1], previous

    async def on_or_before(self, target: date) -> MortgageRateObservation | None:
        eligible = [observation for observation in await self.history() if observation.observed_on <= target]
        return eligible[-1] if eligible else None

    async def _download(self) -> list[MortgageRateObservation]:
        try:
            response = await self._http.get(FREDDIE_MAC_PMMS_URL)
            response.raise_for_status()
            observations = parse_pmms_csv(response.text)
            if observations:
                return observations
        except (httpx.HTTPError, ValueError):
            pass
        return await self._download_from_fred()

    async def _download_from_fred(self) -> list[MortgageRateObservation]:
        try:
            thirty = await self._http.get(FRED_SERIES_URL.format(series="MORTGAGE30US"))
            fifteen = await self._http.get(FRED_SERIES_URL.format(series="MORTGAGE15US"))
            thirty.raise_for_status()
            fifteen.raise_for_status()
        except httpx.HTTPError as error:
            raise MarketDataUnavailableError("Mortgage rate feeds are unavailable") from error
        rates_30y = parse_fred_csv(thirty.text)
        rates_15y = parse_fred_csv(fifteen.text)
        return [
            MortgageRateObservation(observed_on, rate, rates_15y.get(observed_on))
            for observed_on, rate in sorted(rates_30y.items())
        ]
