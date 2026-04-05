from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ScenarioConfig(BaseModel):
    input_sizes: list[int] = Field(default_factory=lambda: [100, 1000, 5000])
    iterations: int = Field(default=3, ge=1, le=50)
    random_seed: int = 42
    timeout_ms: int = Field(default=3000, ge=100, le=60000)
    memory_cap_mb: int = Field(default=256, ge=64, le=4096)
    cpu_cap: float = Field(default=1.0, ge=0.25, le=8.0)
    data_shape: Literal["random", "sorted", "reverse", "duplicate-heavy", "custom"] = "random"
    custom_data: dict | None = None

    @field_validator("input_sizes")
    @classmethod
    def validate_input_sizes(cls, value: list[int]) -> list[int]:
        if not value:
            raise ValueError("input_sizes cannot be empty")
        return value


class ScenarioPreset(BaseModel):
    id: str
    name: str
    description: str
    tags: list[str]
    scenario: ScenarioConfig


class Recommendation(BaseModel):
    title: str
    detail: str
    category: Literal["time", "memory", "risk", "readability"]
    priority: Literal["low", "medium", "high"]


class SimulationRequest(BaseModel):
    language: Literal["python"] = "python"
    code: str = Field(min_length=1)
    entrypoint: str | None = Field(default=None, max_length=255)
    scenario: ScenarioConfig
    profile_label: str | None = Field(default=None, max_length=120)


class AnalysisRequest(BaseModel):
    language: Literal["python"] = "python"
    code: str = Field(min_length=1)
    entrypoint: str | None = Field(default=None, max_length=255)
    profile_label: str | None = Field(default=None, max_length=120)


class CompareCodeInput(BaseModel):
    language: Literal["python"] = "python"
    code: str = Field(min_length=1)
    entrypoint: str | None = Field(default=None, max_length=255)
    label: str = Field(default="Snippet", min_length=1, max_length=100)


class CompareInlineRequest(BaseModel):
    left: CompareCodeInput
    right: CompareCodeInput
    scenario: ScenarioConfig


class CodeAnnotation(BaseModel):
    line_start: int
    line_end: int
    severity: Literal["low", "medium", "high"]
    category: Literal["time", "memory", "risk"]
    message: str
    weights: dict[str, float]


class Hotspot(BaseModel):
    line_start: int
    line_end: int
    severity: Literal["low", "medium", "high"]
    type: Literal["time", "memory", "risk"]
    label: str


class InsightsResponse(BaseModel):
    explanation: str
    detected_entrypoint: str | None
    warnings: list[str]
    hotspots: list[Hotspot]
    complexity_hints: list[str]
    annotations: list[CodeAnnotation]
    recommendations: list[Recommendation] = []
    risk_score: int = 0


class SampleResult(BaseModel):
    input_size: int
    iteration_index: int
    runtime_ms: float
    memory_mb: float
    cpu_percent: float
    exit_code: int
    timeout_triggered: bool = False


class InputSizeResult(BaseModel):
    input_size: int
    avg_runtime_ms: float
    peak_memory_mb: float
    cpu_avg_percent: float
    samples: list[SampleResult]


class SummaryResponse(BaseModel):
    avg_runtime_ms: float | None
    peak_memory_mb: float | None
    cpu_avg_percent: float | None
    total_runtime_ms: float | None = None
    p95_runtime_ms: float | None = None


class ExecutionResponse(BaseModel):
    timeout_triggered: bool
    memory_limit_mb: int
    cpu_limit: float
    network_disabled: bool
    runtime_info: dict[str, str | int | float | bool | None]


class ReportResponse(BaseModel):
    generated_at: str = Field(default_factory=utc_now_iso)
    export_filename: str
    profile_label: str
    cache_hit: bool = False


class SimulationResponse(BaseModel):
    status: Literal["success", "error"]
    summary: SummaryResponse
    results: list[InputSizeResult]
    stdout: str
    stderr: str
    exit_code: int
    insights: InsightsResponse
    execution: ExecutionResponse
    report: ReportResponse


class AnalyzeResponse(BaseModel):
    status: Literal["success"]
    insights: InsightsResponse
    report: ReportResponse


class ComparisonSummary(BaseModel):
    avg_runtime_delta_ms: float | None
    peak_memory_delta_mb: float | None
    cpu_avg_delta_percent: float | None
    faster_label: str | None
    lower_memory_label: str | None
    risk_score_delta: int | None = None


class CompareInlineResponse(BaseModel):
    status: Literal["success"]
    left: SimulationResponse
    right: SimulationResponse
    comparison: ComparisonSummary


class CapabilitiesResponse(BaseModel):
    stateless: bool
    supported_languages: list[str]
    features: list[str]
    resource_limits: dict[str, int | float | bool]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    mode: Literal["stateless"]
    sandbox_image: str
    supported_languages: list[str]
    cache: dict[str, dict[str, int]]
