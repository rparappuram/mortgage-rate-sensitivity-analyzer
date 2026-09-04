from fastapi import APIRouter, Request

from app.schemas.market import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    cache = request.app.state.cache
    treasury_years = [cache.peek(key) for key in cache.cached_keys() if key.startswith("treasury:")]
    treasury_as_of = max((rows[-1].observed_on for rows in treasury_years if rows), default=None)
    mortgage_rows = cache.peek("mortgage-rates")
    return HealthResponse(
        status="ok",
        version=request.app.version,
        treasury_as_of=treasury_as_of,
        mortgage_as_of=mortgage_rows[-1].observed_on if mortgage_rows else None,
    )
