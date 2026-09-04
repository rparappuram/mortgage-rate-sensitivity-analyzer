import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.api import analysis, health, market
from app.data.cache import AsyncTtlCache
from app.data.errors import MarketDataUnavailableError
from app.data.mortgage_rates import MortgageRateClient
from app.data.treasury import TreasuryClient
from app.services.analyzer import AnalysisError
from app.services.market import MarketDataService
from app.settings import Settings, get_settings

APP_VERSION = "2.0.0"
USER_AGENT = "mrsa.app (Mortgage Rate Sensitivity Analyzer)"

logger = logging.getLogger("mrsa")


def build_market_service(
    http: httpx.AsyncClient, cache: AsyncTtlCache, settings: Settings
) -> MarketDataService:
    treasury = TreasuryClient(
        http,
        cache,
        current_year_ttl_seconds=settings.treasury_current_year_ttl_seconds,
        past_year_ttl_seconds=settings.treasury_past_year_ttl_seconds,
    )
    mortgage = MortgageRateClient(http, cache, ttl_seconds=settings.mortgage_rates_ttl_seconds)
    return MarketDataService(treasury, mortgage, history_weeks=settings.history_weeks)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    cache = AsyncTtlCache()
    async with httpx.AsyncClient(
        timeout=settings.http_timeout_seconds,
        headers={"User-Agent": USER_AGENT},
        follow_redirects=True,
    ) as http:
        app.state.cache = cache
        app.state.market = build_market_service(http, cache, settings)
        warmup = asyncio.create_task(warm_cache(app.state.market)) if settings.warm_cache_on_startup else None
        yield
        if warmup is not None and not warmup.done():
            warmup.cancel()


async def warm_cache(service: MarketDataService) -> None:
    try:
        await service.warm()
        logger.info("market data cache warmed")
    except Exception:
        logger.exception("market data cache warmup failed")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Mortgage Rate Sensitivity Analyzer API",
        version=APP_VERSION,
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        max_age=3600,
    )
    app.include_router(health.router)
    app.include_router(market.router)
    app.include_router(analysis.router)
    app.add_exception_handler(MarketDataUnavailableError, market_data_unavailable)
    app.add_exception_handler(AnalysisError, analysis_error)
    return app


async def market_data_unavailable(request: Request, error: Exception) -> JSONResponse:
    logger.warning("market data unavailable: %s", error)
    return JSONResponse(status_code=503, content={"detail": str(error)})


async def analysis_error(request: Request, error: Exception) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(error)})


app = create_app()
