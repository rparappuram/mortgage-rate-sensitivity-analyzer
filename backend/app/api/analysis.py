from datetime import date

from fastapi import APIRouter

from app.api.dependencies import MarketService
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analyzer import run_analysis

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest, service: MarketService) -> AnalysisResponse:
    requested = request.valuation.as_of
    if requested is None or requested >= date.today():
        snapshot = await service.current()
    else:
        snapshot = await service.as_of(requested)
    return run_analysis(request, snapshot)
