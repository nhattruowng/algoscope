import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Download, PlaySquare } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link, useParams } from "react-router-dom";

import type { HeatmapMode } from "@algoscope/shared-types";
import { HeatmapEditor } from "@/components/heatmap/heatmap-editor";
import { RunStatusBadge } from "@/components/run-detail/run-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCpu, formatDuration, formatMemory } from "@/lib/format";
import { buildSeries, countSamples } from "@/lib/metrics";
import { getLatestSimulationSession, getSimulationSessionById } from "@/lib/session-result";

type TabKey = "overview" | "metrics" | "logs" | "code-insight";

export function RunDetailPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [mode, setMode] = useState<HeatmapMode>("time");
  const { sessionId } = useParams();

  const session = sessionId ? getSimulationSessionById(sessionId) : getLatestSimulationSession();
  const result = session?.result ?? null;
  const series = useMemo(() => buildSeries(result?.results ?? []), [result?.results]);

  if (!result || !session) {
    return (
      <div className="rounded-3xl border border-line bg-panel/95 p-8">
        <div className="section-title mb-2">Run Detail</div>
        <h1 className="text-2xl font-semibold">Không tìm thấy run trong session hiện tại</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Hệ thống stateless không có dữ liệu lịch sử phía backend. Chỉ những run còn nằm trong session browser mới
          xem lại được.
        </p>
        <Link to="/simulations/new" className="mt-4 inline-block">
          <Button>
            <PlaySquare className="mr-2 h-4 w-4" />
            Run Simulation
          </Button>
        </Link>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "metrics", label: "Metrics" },
    { key: "logs", label: "Logs" },
    { key: "code-insight", label: "Code Insight" },
  ];

  function downloadReport() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.report.export_filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-line bg-panel/95 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="section-title mb-2">Run Detail</div>
          <h1 className="text-3xl font-semibold tracking-tight">{session.title}</h1>
          <p className="mt-2 text-sm text-muted">
            Entrypoint{" "}
            {String(result.execution.runtime_info.detected_entrypoint ?? result.insights.detected_entrypoint ?? "auto-detect")}{" "}
            · tạo lúc {new Date(session.created_at).toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RunStatusBadge status={result.status} />
          <Button variant="secondary" onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Average Runtime" value={formatDuration(result.summary.avg_runtime_ms)} />
        <MetricCard label="Peak Memory" value={formatMemory(result.summary.peak_memory_mb)} />
        <MetricCard label="CPU Avg" value={formatCpu(result.summary.cpu_avg_percent)} />
        <MetricCard label="p95 Runtime" value={formatDuration(result.summary.p95_runtime_ms)} />
        <MetricCard label="Risk Score" value={String(result.insights.risk_score)} />
        <MetricCard label="Samples" value={String(countSamples(result))} />
      </section>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button key={item.key} variant={tab === item.key ? "primary" : "secondary"} onClick={() => setTab(item.key)}>
            {item.label}
          </Button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <div className="space-y-6">
            <section className="grid gap-6 xl:grid-cols-2">
              <ChartCard title="Runtime by Input Size">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={series}>
                    <CartesianGrid stroke="#1d3445" strokeDasharray="4 4" />
                    <XAxis dataKey="inputSize" stroke="#8da3b7" />
                    <YAxis stroke="#8da3b7" />
                    <Tooltip />
                    <Line type="monotone" dataKey="runtimeMs" stroke="#5ec2ff" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Memory by Input Size">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={series}>
                    <CartesianGrid stroke="#1d3445" strokeDasharray="4 4" />
                    <XAxis dataKey="inputSize" stroke="#8da3b7" />
                    <YAxis stroke="#8da3b7" />
                    <Tooltip />
                    <Line type="monotone" dataKey="memoryMb" stroke="#67d39b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <Card>
              <CardHeader>
                <div className="section-title">Recommendations</div>
                <div className="mt-1 text-lg font-semibold">Khuyến nghị tối ưu heuristic</div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {result.insights.recommendations.length ? (
                  result.insights.recommendations.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-line bg-panelAlt p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{item.title}</div>
                        <div className="flex gap-2">
                          <Badge value={item.category} tone="default" />
                          <Badge value={item.priority} tone="default" />
                        </div>
                      </div>
                      <p className="mt-2 leading-6 text-muted">{item.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Chưa có recommendation đáng kể.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="section-title">Execution Metadata</div>
                <div className="mt-1 text-lg font-semibold">Thông tin runtime và resource limit</div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Timeout triggered" value={String(result.execution.timeout_triggered)} />
                <InfoRow label="Memory limit" value={`${result.execution.memory_limit_mb} MB`} />
                <InfoRow label="CPU limit" value={String(result.execution.cpu_limit)} />
                <InfoRow label="Network disabled" value={String(result.execution.network_disabled)} />
                <InfoRow label="Report file" value={result.report.export_filename} />
                <InfoRow label="Cache hit" value={String(result.report.cache_hit)} />
                {Object.entries(result.execution.runtime_info).map(([key, value]) => (
                  <InfoRow key={key} label={key} value={String(value ?? "--")} />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="section-title">Warnings & Complexity</div>
                <div className="mt-1 text-lg font-semibold">Tóm tắt heuristic</div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="font-semibold text-text">Warnings</div>
                  <div className="mt-2 space-y-2">
                    {result.insights.warnings.length ? (
                      result.insights.warnings.map((warning, index) => (
                        <div key={index} className="rounded-xl border border-line bg-panelAlt p-3 text-muted">
                          {warning}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">Không có warning nào được sinh ra.</p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-text">Complexity hints</div>
                  <div className="mt-2 space-y-2">
                    {result.insights.complexity_hints.map((hint, index) => (
                      <div key={index} className="rounded-xl border border-line bg-panelAlt p-3 text-muted">
                        {hint}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {tab === "metrics" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="section-title">Per Input Size Results</div>
              <div className="mt-1 text-lg font-semibold">Kết quả đã tổng hợp từ response stateless</div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-muted">
                  <tr>
                    <th className="pb-3">Input Size</th>
                    <th className="pb-3">Avg Runtime</th>
                    <th className="pb-3">Peak Memory</th>
                    <th className="pb-3">CPU Avg</th>
                    <th className="pb-3">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((item) => (
                    <tr key={item.input_size} className="border-t border-line/60">
                      <td className="py-3">{item.input_size}</td>
                      <td className="py-3">{formatDuration(item.avg_runtime_ms)}</td>
                      <td className="py-3">{formatMemory(item.peak_memory_mb)}</td>
                      <td className="py-3">{formatCpu(item.cpu_avg_percent)}</td>
                      <td className="py-3">{item.samples.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="section-title">Raw Samples</div>
              <div className="mt-1 text-lg font-semibold">Từng iteration theo input size</div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.results.map((item) => (
                <div key={item.input_size} className="rounded-2xl border border-line bg-panelAlt p-4">
                  <div className="mb-3 font-semibold">Input size {item.input_size}</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-muted">
                        <tr>
                          <th className="pb-2">Iteration</th>
                          <th className="pb-2">Runtime</th>
                          <th className="pb-2">Memory</th>
                          <th className="pb-2">CPU</th>
                          <th className="pb-2">Exit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.samples.map((sample) => (
                          <tr key={`${item.input_size}-${sample.iteration_index}`} className="border-t border-line/60">
                            <td className="py-2">{sample.iteration_index}</td>
                            <td className="py-2">{formatDuration(sample.runtime_ms)}</td>
                            <td className="py-2">{formatMemory(sample.memory_mb)}</td>
                            <td className="py-2">{formatCpu(sample.cpu_percent)}</td>
                            <td className="py-2">{sample.exit_code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "logs" ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <LogCard title="stdout" value={result.stdout} />
          <LogCard title="stderr" value={result.stderr} />
        </section>
      ) : null}

      {tab === "code-insight" ? (
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <div>
                <div className="section-title">Inline Heatmap</div>
                <div className="mt-1 text-lg font-semibold">Heuristic overlay</div>
              </div>
              <div className="flex gap-2">
                {(["time", "memory", "risk"] as HeatmapMode[]).map((item) => (
                  <Button key={item} variant={mode === item ? "primary" : "secondary"} onClick={() => setMode(item)}>
                    {item}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <HeatmapEditor
                code={String(result.execution.runtime_info.source_code ?? "")}
                annotations={result.insights.annotations}
                mode={mode}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="section-title">Insight Panel</div>
              <div className="mt-1 text-lg font-semibold">Hotspot và explanation</div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="font-semibold text-text">Explanation</div>
                <p className="mt-2 leading-6 text-muted">{result.insights.explanation}</p>
              </div>
              <div>
                <div className="font-semibold text-text">Hotspots</div>
                <div className="mt-2 space-y-2">
                  {result.insights.hotspots.map((item, index) => (
                    <div key={index} className="rounded-xl border border-line bg-panelAlt p-3 text-muted">
                      Dòng {item.line_start}-{item.line_end}: {item.label}
                    </div>
                  ))}
                  {!result.insights.hotspots.length ? <p className="text-muted">Không có hotspot nổi bật.</p> : null}
                </div>
              </div>
              <div>
                <div className="font-semibold text-text">Annotations</div>
                <div className="mt-2 space-y-2">
                  {result.insights.annotations.map((annotation, index) => (
                    <div key={index} className="rounded-xl border border-line bg-panelAlt p-3 text-muted">
                      [{annotation.category}] dòng {annotation.line_start}-{annotation.line_end}: {annotation.message}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="section-title">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="section-title">{title}</div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function LogCard({ title, value }: { title: string; value?: string | null }) {
  return (
    <Card>
      <CardHeader>
        <div className="section-title">{title}</div>
      </CardHeader>
      <CardContent>
        <pre className="min-h-[240px] whitespace-pre-wrap rounded-xl border border-line bg-panelAlt p-4 font-mono text-xs text-muted">
          {value || "No output captured."}
        </pre>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panelAlt p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-2 text-sm font-semibold text-text">{value}</div>
    </div>
  );
}
