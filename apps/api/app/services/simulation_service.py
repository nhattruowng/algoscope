from fastapi import HTTPException, status

from app.analyzers.python_heuristics import PythonHeuristicAnalyzer
from app.cache.memory_cache import TTLMemoryCache
from app.profiling.aggregator import summarize_results_by_input_size, summarize_samples
from app.runners.docker_runner import DockerSandboxRunner, SandboxExecutionError
from app.schemas.simulation import (
    AnalyzeResponse,
    AnalysisRequest,
    CompareInlineRequest,
    CompareInlineResponse,
    ComparisonSummary,
    ExecutionResponse,
    InsightsResponse,
    SimulationRequest,
    SimulationResponse,
    SummaryResponse,
)
from app.security.sandbox_policy import build_sandbox_policy
from app.services.report_service import ReportService


analysis_cache = TTLMemoryCache(ttl_seconds=180, max_entries=128)


class SimulationService:
    def __init__(self) -> None:
        self.analyzer = PythonHeuristicAnalyzer()
        self.runner = DockerSandboxRunner()
        self.report_service = ReportService()

    def analyze(self, payload: AnalysisRequest) -> AnalyzeResponse:
        self._validate_language(payload.language)
        insights, cache_hit = self._get_or_compute_insights(payload.code, payload.entrypoint)
        return AnalyzeResponse(
            status="success",
            insights=InsightsResponse.model_validate(insights),
            report=self.report_service.build_report_metadata(
                code=payload.code,
                entrypoint=payload.entrypoint,
                profile_label=payload.profile_label,
                cache_hit=cache_hit,
                kind="analysis",
            ),
        )

    def simulate(self, payload: SimulationRequest) -> SimulationResponse:
        self._validate_language(payload.language)
        insights, cache_hit = self._get_or_compute_insights(payload.code, payload.entrypoint)
        if any("Lỗi cú pháp" in warning or "Syntax error" in warning for warning in insights["warnings"]):
            return self._build_early_error_response(
                payload=payload,
                insights=insights,
                stderr="Code contains a syntax error and could not be executed.",
                cache_hit=cache_hit,
            )
        if not (payload.entrypoint or insights.get("detected_entrypoint")):
            insights["warnings"].append("Không phát hiện được entrypoint callable để benchmark.")
            insights["complexity_hints"].append("Cần cung cấp hoặc định nghĩa một entrypoint callable.")
            return self._build_early_error_response(
                payload=payload,
                insights=insights,
                stderr="No callable entrypoint could be detected.",
                cache_hit=cache_hit,
            )

        sandbox_payload = {
            "language": payload.language,
            "code": payload.code,
            "entrypoint": payload.entrypoint or insights.get("detected_entrypoint"),
            "input_sizes": payload.scenario.input_sizes,
            "iterations": payload.scenario.iterations,
            "random_seed": payload.scenario.random_seed,
            "timeout_ms": payload.scenario.timeout_ms,
            "memory_cap_mb": payload.scenario.memory_cap_mb,
            "cpu_cap": payload.scenario.cpu_cap,
            "data_shape": payload.scenario.data_shape,
            "custom_data": payload.scenario.custom_data,
        }

        try:
            sandbox_result = self.runner.run(sandbox_payload)
        except SandboxExecutionError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

        samples = sandbox_result.get("samples", [])
        summary = summarize_samples(samples)
        results = summarize_results_by_input_size(samples)
        policy = build_sandbox_policy(
            memory_cap_mb=payload.scenario.memory_cap_mb,
            cpu_cap=payload.scenario.cpu_cap,
            timeout_ms=payload.scenario.timeout_ms,
        )
        timeout_triggered = any(sample.get("timeout_triggered", False) for sample in samples)
        exit_code = sandbox_result.get("exit_code", 1)

        return SimulationResponse(
            status="success" if exit_code == 0 else "error",
            summary=SummaryResponse.model_validate(summary),
            results=results,
            stdout=sandbox_result.get("stdout", ""),
            stderr=sandbox_result.get("stderr", ""),
            exit_code=exit_code,
            insights=InsightsResponse.model_validate(insights),
            execution=ExecutionResponse(
                timeout_triggered=timeout_triggered,
                memory_limit_mb=policy["memory_cap_mb"],
                cpu_limit=policy["cpu_cap"],
                network_disabled=policy["network_disabled"],
                runtime_info={
                    "language": payload.language,
                    "detected_entrypoint": sandbox_result.get("detected_entrypoint") or insights.get("detected_entrypoint"),
                    "iterations": payload.scenario.iterations,
                    "sample_count": len(samples),
                    "input_size_count": len(payload.scenario.input_sizes),
                    "data_shape": payload.scenario.data_shape,
                    "python_version": (sandbox_result.get("runtime_info") or {}).get("python_version"),
                    "sandbox_runner": (sandbox_result.get("runtime_info") or {}).get("sandbox_runner"),
                    "source_code": payload.code,
                    "profile_label": payload.profile_label or payload.entrypoint or "python-snippet",
                },
            ),
            report=self.report_service.build_report_metadata(
                code=payload.code,
                entrypoint=payload.entrypoint,
                profile_label=payload.profile_label,
                cache_hit=cache_hit,
                kind="simulation",
            ),
        )

    def compare_inline(self, payload: CompareInlineRequest) -> CompareInlineResponse:
        left = self.simulate(
            SimulationRequest(
                language=payload.left.language,
                code=payload.left.code,
                entrypoint=payload.left.entrypoint,
                scenario=payload.scenario,
                profile_label=payload.left.label,
            )
        )
        right = self.simulate(
            SimulationRequest(
                language=payload.right.language,
                code=payload.right.code,
                entrypoint=payload.right.entrypoint,
                scenario=payload.scenario,
                profile_label=payload.right.label,
            )
        )

        left_runtime = left.summary.avg_runtime_ms or 0
        right_runtime = right.summary.avg_runtime_ms or 0
        left_memory = left.summary.peak_memory_mb or 0
        right_memory = right.summary.peak_memory_mb or 0
        left_cpu = left.summary.cpu_avg_percent or 0
        right_cpu = right.summary.cpu_avg_percent or 0

        comparison = ComparisonSummary(
            avg_runtime_delta_ms=round(right_runtime - left_runtime, 3),
            peak_memory_delta_mb=round(right_memory - left_memory, 3),
            cpu_avg_delta_percent=round(right_cpu - left_cpu, 3),
            faster_label=payload.left.label if left_runtime <= right_runtime else payload.right.label,
            lower_memory_label=payload.left.label if left_memory <= right_memory else payload.right.label,
            risk_score_delta=right.insights.risk_score - left.insights.risk_score,
        )
        return CompareInlineResponse(status="success", left=left, right=right, comparison=comparison)

    def _validate_language(self, language: str) -> None:
        if language != "python":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phiên bản MVP hiện chỉ hỗ trợ ngôn ngữ Python.",
            )

    def _get_or_compute_insights(self, code: str, entrypoint: str | None) -> tuple[dict, bool]:
        key = analysis_cache.make_key("analysis", entrypoint or "auto", code)
        cached = analysis_cache.get(key)
        if cached is not None:
            return cached, True
        insights = self.analyzer.analyze(code, entrypoint)
        analysis_cache.set(key, insights)
        return insights, False

    def _build_early_error_response(
        self,
        *,
        payload: SimulationRequest,
        insights: dict,
        stderr: str,
        cache_hit: bool,
    ) -> SimulationResponse:
        policy = build_sandbox_policy(
            memory_cap_mb=payload.scenario.memory_cap_mb,
            cpu_cap=payload.scenario.cpu_cap,
            timeout_ms=payload.scenario.timeout_ms,
        )
        return SimulationResponse(
            status="error",
            summary=SummaryResponse(
                avg_runtime_ms=None,
                peak_memory_mb=None,
                cpu_avg_percent=None,
                total_runtime_ms=None,
                p95_runtime_ms=None,
            ),
            results=[],
            stdout="",
            stderr=stderr,
            exit_code=1,
            insights=InsightsResponse.model_validate(insights),
            execution=ExecutionResponse(
                timeout_triggered=False,
                memory_limit_mb=policy["memory_cap_mb"],
                cpu_limit=policy["cpu_cap"],
                network_disabled=policy["network_disabled"],
                runtime_info={
                    "language": payload.language,
                    "detected_entrypoint": insights.get("detected_entrypoint"),
                    "iterations": payload.scenario.iterations,
                    "sample_count": 0,
                    "input_size_count": len(payload.scenario.input_sizes),
                    "data_shape": payload.scenario.data_shape,
                    "sandbox_runner": "not-started",
                    "source_code": payload.code,
                    "profile_label": payload.profile_label or payload.entrypoint or "python-snippet",
                },
            ),
            report=self.report_service.build_report_metadata(
                code=payload.code,
                entrypoint=payload.entrypoint,
                profile_label=payload.profile_label,
                cache_hit=cache_hit,
                kind="simulation",
            ),
        )
