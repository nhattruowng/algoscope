from fastapi import APIRouter

from app.cache.memory_cache import TTLMemoryCache
from app.config.settings import get_settings
from app.schemas.simulation import HealthResponse
from app.services.catalog_service import catalog_cache
from app.services.simulation_service import analysis_cache


router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        mode="stateless",
        sandbox_image=settings.sandbox_image,
        supported_languages=["python"],
        cache={
            "analysis": analysis_cache.stats(),
            "catalog": catalog_cache.stats(),
        },
    )

