import type { CompareInlineResponse, InputSizeResult, SimulationResponse } from "@algoscope/shared-types";

export interface SeriesPoint {
  inputSize: number;
  runtimeMs: number;
  memoryMb: number;
  cpuPercent: number;
}

export function buildSeries(results: InputSizeResult[]): SeriesPoint[] {
  return [...results]
    .sort((a, b) => a.input_size - b.input_size)
    .map((item) => ({
      inputSize: item.input_size,
      runtimeMs: item.avg_runtime_ms,
      memoryMb: item.peak_memory_mb,
      cpuPercent: item.cpu_avg_percent,
    }));
}

export function countSamples(result?: SimulationResponse | null) {
  return result?.results.reduce((total, item) => total + item.samples.length, 0) ?? 0;
}

export function compareSimulations(left?: SimulationResponse | null, right?: SimulationResponse | null) {
  const runtimeDelta = (right?.summary.avg_runtime_ms ?? 0) - (left?.summary.avg_runtime_ms ?? 0);
  const memoryDelta = (right?.summary.peak_memory_mb ?? 0) - (left?.summary.peak_memory_mb ?? 0);
  const cpuDelta = (right?.summary.cpu_avg_percent ?? 0) - (left?.summary.cpu_avg_percent ?? 0);
  const riskDelta = (right?.insights.risk_score ?? 0) - (left?.insights.risk_score ?? 0);

  return {
    runtimeDelta,
    memoryDelta,
    cpuDelta,
    riskDelta,
    runtimeDirection: runtimeDelta <= 0 ? "improved" : "regressed",
    memoryDirection: memoryDelta <= 0 ? "improved" : "regressed",
    riskDirection: riskDelta <= 0 ? "improved" : "regressed",
  };
}

export function comparisonToChart(response?: CompareInlineResponse | null) {
  if (!response) return [];
  return [
    {
      name: response.left.report.profile_label ?? "Left",
      runtime: response.left.summary.avg_runtime_ms ?? 0,
      memory: response.left.summary.peak_memory_mb ?? 0,
      risk: response.left.insights.risk_score ?? 0,
    },
    {
      name: response.right.report.profile_label ?? "Right",
      runtime: response.right.summary.avg_runtime_ms ?? 0,
      memory: response.right.summary.peak_memory_mb ?? 0,
      risk: response.right.insights.risk_score ?? 0,
    },
  ];
}
