from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.dependencies import MarketService
from app.schemas.market import CurveResponse, MarketResponse
from app.services.market import mortgage_snapshot, spread_2s10s_bps, tenor_rates, treasury_snapshot

router = APIRouter(prefix="/api", tags=["market"])


@router.get("/market", response_model=MarketResponse)
async def get_market(service: MarketService) -> MarketResponse:
    snapshot = await service.current()
    return MarketResponse(
        treasury=treasury_snapshot(snapshot.treasury, snapshot.treasury_previous),
        mortgage=mortgage_snapshot(snapshot.mortgage, snapshot.mortgage_previous, snapshot.treasury),
        history=await service.history(),
    )


@router.get("/curve", response_model=CurveResponse)
async def get_curve(as_of: Annotated[date, Query()], service: MarketService) -> CurveResponse:
    snapshot = await service.as_of(min(as_of, date.today()))
    spread = spread_2s10s_bps(snapshot.treasury)
    return CurveResponse(
        requested=as_of,
        as_of=snapshot.treasury.observed_on,
        tenors=tenor_rates(snapshot.treasury, snapshot.treasury_previous),
        spread_2s10s_bps=spread,
        inverted=spread is not None and spread < 0,
    )
