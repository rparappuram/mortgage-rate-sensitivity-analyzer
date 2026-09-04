from contextlib import asynccontextmanager
from datetime import date, timedelta

import httpx
import pytest

from app.data.cache import AsyncTtlCache
from app.data.mortgage_rates import MortgageRateObservation
from app.data.treasury import ParCurveObservation
from app.main import create_app
from app.services.market import MarketDataService
from tests.conftest import SAMPLE_PAR_RATES


class StubTreasuryClient:
    def __init__(self, observations: list[ParCurveObservation]) -> None:
        self._observations = sorted(observations, key=lambda observation: observation.observed_on)

    async def latest(self):
        return self._observations[-1], self._observations[-2] if len(self._observations) > 1 else None

    async def on_or_before(self, target: date):
        eligible = [observation for observation in self._observations if observation.observed_on <= target]
        return eligible[-1]

    async def observations_between(self, start: date, end: date):
        return [observation for observation in self._observations if start <= observation.observed_on <= end]


class StubMortgageClient:
    def __init__(self, observations: list[MortgageRateObservation]) -> None:
        self._observations = observations

    async def history(self):
        return self._observations

    async def latest(self):
        return self._observations[-1], self._observations[-2] if len(self._observations) > 1 else None

    async def on_or_before(self, target: date):
        eligible = [observation for observation in self._observations if observation.observed_on <= target]
        return eligible[-1] if eligible else None


@pytest.fixture
async def client():
    today = date.today()
    treasury = StubTreasuryClient(
        [
            ParCurveObservation(
                today - timedelta(days=1), {label: rate - 0.02 for label, rate in SAMPLE_PAR_RATES.items()}
            ),
            ParCurveObservation(today, dict(SAMPLE_PAR_RATES)),
        ]
    )
    mortgage = StubMortgageClient(
        [
            MortgageRateObservation(today - timedelta(days=8), 6.66, 5.98),
            MortgageRateObservation(today - timedelta(days=1), 6.71, 6.04),
        ]
    )
    app = create_app()
    app.router.lifespan_context = _noop_lifespan
    app.state.market = MarketDataService(treasury, mortgage, history_weeks=52)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client


@asynccontextmanager
async def _noop_lifespan(app):
    yield


async def test_market_endpoint_returns_curve_and_mortgage_rates(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/market")
    assert response.status_code == 200
    body = response.json()
    assert body["treasury"]["as_of"] == date.today().isoformat()
    assert len(body["treasury"]["tenors"]) == len(SAMPLE_PAR_RATES)
    assert body["treasury"]["spread_2s10s_bps"] == pytest.approx(41.0)
    assert body["treasury"]["inverted"] is False
    assert body["mortgage"]["rate_30y"] == 6.71
    assert body["mortgage"]["change_1w_bps"] == pytest.approx(5.0)
    assert body["history"][-1]["mortgage_30y"] == 6.71
    assert body["history"][-1]["treasury_10y"] == pytest.approx(4.76)


async def test_analyze_endpoint_returns_full_analysis(client: httpx.AsyncClient) -> None:
    payload = {
        "loan": {
            "original_balance": 400000,
            "note_rate_pct": 6.5,
            "term_months": 360,
            "origination_date": "2023-06-01",
        },
        "prepayment": {"model": "refinance_incentive"},
        "shock": {"mode": "parallel", "parallel_bps": 100},
    }
    response = await client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["loan"]["monthly_payment"] == pytest.approx(2528.27, abs=0.01)
    assert body["loan"]["balance_source"] == "scheduled"
    assert body["loan"]["current_balance"] == body["loan"]["scheduled_balance"]
    assert 80 < body["valuation"]["price"] < 110
    assert body["shock"]["pnl"] < 0
    assert body["shock"]["mortgage_rate_30y"] == pytest.approx(7.71)
    assert len(body["scenarios"]) == 12
    assert len(body["price_curve"]) == 25
    assert body["monthly_cashflows"][0]["month"] == 1
    assert body["refinance"]["market_rate"] == 6.71
    assert body["market"]["spread_bps"] == pytest.approx(193.0)


async def test_analyze_rejects_matured_loans(client: httpx.AsyncClient) -> None:
    payload = {
        "loan": {
            "original_balance": 100000,
            "note_rate_pct": 5,
            "term_months": 120,
            "origination_date": "2010-01-01",
        }
    }
    response = await client.post("/api/analyze", json=payload)
    assert response.status_code == 422


async def test_analyze_validates_inputs(client: httpx.AsyncClient) -> None:
    payload = {
        "loan": {
            "original_balance": -5,
            "note_rate_pct": 6.5,
            "term_months": 360,
            "origination_date": "2023-06-01",
        }
    }
    response = await client.post("/api/analyze", json=payload)
    assert response.status_code == 422


async def test_health_reports_status(client: httpx.AsyncClient) -> None:
    client._transport.app.state.cache = AsyncTtlCache()
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
