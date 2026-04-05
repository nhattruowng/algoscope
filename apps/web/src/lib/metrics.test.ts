import { buildSeries, comparisonToChart, compareSimulations } from "@/lib/metrics";

describe("metrics helpers", () => {
  it("maps aggregated results into chart series", () => {
    const series = buildSeries([
      {
        input_size: 100,
        avg_runtime_ms: 2,
        peak_memory_mb: 3,
        cpu_avg_percent: 30,
        samples: [],
      },
    ]);

    expect(series).toEqual([{ inputSize: 100, runtimeMs: 2, memoryMb: 3, cpuPercent: 30 }]);
  });

  it("computes deltas between two stateless simulation responses", () => {
    const result = compareSimulations(
      {
        summary: {
          avg_runtime_ms: 4,
          peak_memory_mb: 10,
          cpu_avg_percent: 30,
        },
        insights: {
          risk_score: 25,
        },
      } as never,
      {
        summary: {
          avg_runtime_ms: 6,
          peak_memory_mb: 8,
          cpu_avg_percent: 40,
        },
        insights: {
          risk_score: 40,
        },
      } as never,
    );

    expect(result.runtimeDelta).toBe(2);
    expect(result.memoryDelta).toBe(-2);
    expect(result.cpuDelta).toBe(10);
    expect(result.riskDelta).toBe(15);
    expect(result.runtimeDirection).toBe("regressed");
    expect(result.memoryDirection).toBe("improved");
    expect(result.riskDirection).toBe("regressed");
  });

  it("builds chart rows using profile labels from reports", () => {
    const rows = comparisonToChart({
      status: "success",
      left: {
        summary: { avg_runtime_ms: 3, peak_memory_mb: 12 },
        insights: { risk_score: 18 },
        report: { profile_label: "Baseline" },
      },
      right: {
        summary: { avg_runtime_ms: 5, peak_memory_mb: 16 },
        insights: { risk_score: 52 },
        report: { profile_label: "Candidate" },
      },
      comparison: {},
    } as never);

    expect(rows).toEqual([
      { name: "Baseline", runtime: 3, memory: 12, risk: 18 },
      { name: "Candidate", runtime: 5, memory: 16, risk: 52 },
    ]);
  });
});
