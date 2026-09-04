from typing import Annotated

from fastapi import Depends, Request

from app.services.market import MarketDataService


def market_service(request: Request) -> MarketDataService:
    return request.app.state.market


MarketService = Annotated[MarketDataService, Depends(market_service)]
