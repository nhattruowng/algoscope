from fastapi import APIRouter

from app.schemas.simulation import (
    AnalyzeResponse,
    AnalysisRequest,
    CapabilitiesResponse,
    CompareInlineRequest,
    CompareInlineResponse,
    ScenarioPreset,
    SimulationRequest,
    SimulationResponse,
)
from app.services.catalog_service import CatalogService
from app.services.simulation_service import SimulationService


router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulationResponse)
def simulate(payload: SimulationRequest) -> SimulationResponse:
    service = SimulationService()
    return service.simulate(payload)


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalysisRequest) -> AnalyzeResponse:
    service = SimulationService()
    return service.analyze(payload)


@router.post("/compare-inline", response_model=CompareInlineResponse)
def compare_inline(payload: CompareInlineRequest) -> CompareInlineResponse:
    service = SimulationService()
    return service.compare_inline(payload)


@router.get("/scenario-presets", response_model=list[ScenarioPreset])
def scenario_presets() -> list[ScenarioPreset]:
    service = CatalogService()
    return [ScenarioPreset.model_validate(item) for item in service.list_scenario_presets()]


@router.get("/capabilities", response_model=CapabilitiesResponse)
def capabilities() -> CapabilitiesResponse:
    service = CatalogService()
    return CapabilitiesResponse.model_validate(service.get_capabilities())
