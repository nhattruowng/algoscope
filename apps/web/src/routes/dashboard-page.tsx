import type { ReactNode } from "react";
import { ArrowRight, GaugeCircle, PlaySquare, Rows2, SearchCode, Server, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCapabilities } from "@/hooks/use-capabilities";
import { useHealth } from "@/hooks/use-health";
import { useScenarioPresets } from "@/hooks/use-scenario-presets";
import { formatCpu, formatDuration, formatMemory } from "@/lib/format";
import {
  getLatestAnalyzeResult,
  getLatestCompareResult,
  getLatestSimulationSession,
  getRecentSimulationSessions,
} from "@/lib/session-result";

export function DashboardPage() {
  const latestSession = getLatestSimulationSession();
  const recentRuns = getRecentSimulationSessions();
  const latestAnalyze = getLatestAnalyzeResult();
  const latestCompare = getLatestCompareResult();

  const health = useHealth();
  const capabilities = useCapabilities();
  const presets = useScenarioPresets();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-line bg-panel/95 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="section-title mb-3">AlgoScope Control Plane</div>
          <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
            Nâng cấp từ demo sandbox thành một lab benchmark stateless có cảm giác vận hành thật.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Bạn có preset catalog, analyze-only workspace, local session history, compare trực tiếp, export metadata
            và telemetry nhẹ từ API mà vẫn không cần database hay hàng đợi nền.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/simulations/new">
            <Button>
              <PlaySquare className="mr-2 h-4 w-4" />
              Run Simulation
            </Button>
          </Link>
          <Link to="/analyze">
            <Button variant="secondary">
              <SearchCode className="mr-2 h-4 w-4" />
              Analyze Code
            </Button>
          </Link>
          <Link to="/compare-inline">
            <Button variant="secondary">
              Compare Inline
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricPanel
          label="Scenario Presets"
          value={String(presets.data?.length ?? 0)}
          hint="Catalog preset để chạy nhanh sanity, scaling và memory pressure."
        />
        <MetricPanel
          label="Latest Run"
          value={latestSession?.result.status ?? "--"}
          hint={latestSession ? latestSession.title : "Chưa có simulation nào trong session."}
        />
        <MetricPanel
          label="Risk Snapshot"
          value={latestAnalyze ? String(latestAnalyze.insights.risk_score) : "--"}
          hint="Điểm rủi ro của lần analyze gần nhất trong session trình duyệt."
        />
        <MetricPanel
          label="API Cache"
          value={String(health.data?.cache.analysis.size ?? 0)}
          hint="Bộ nhớ đệm ngắn hạn cho insight và catalog phía API."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="section-title">Platform Snapshot</div>
            <div className="mt-1 text-lg font-semibold">Khả năng hiện tại của runtime</div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon={<Zap className="h-4 w-4" />}
              title="Direct Request Execution"
              body="Request đi thẳng từ FastAPI sang sandbox runner rồi trả kết quả đầy đủ ngay trong response."
            />
            <FeatureCard
              icon={<Server className="h-4 w-4" />}
              title="Honest Statelessness"
              body="Không có run history backend, không saved comparison và không analytics tích lũy."
            />
            <FeatureCard
              icon={<GaugeCircle className="h-4 w-4" />}
              title="Heuristic Insight Layer"
              body="Hotspot, warning, recommendation và heatmap hiện là heuristic, chưa phải line profiler thật."
            />
            <FeatureCard
              icon={<Rows2 className="h-4 w-4" />}
              title="Session-Scoped Workflow"
              body="Browser giữ local session history để giúp trải nghiệm giàu hơn mà không đánh đổi kiến trúc."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="section-title">Live Capability & Health</div>
            <div className="mt-1 text-lg font-semibold">Dữ liệu lấy trực tiếp từ API</div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge value={health.data?.status ?? "loading"} tone={health.data ? "success" : "default"} />
              <Badge value={capabilities.data?.stateless ? "stateless" : "unknown"} tone="default" />
              <Badge value={`Lang: ${(capabilities.data?.supported_languages ?? ["python"]).join(", ")}`} tone="default" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile
                label="Timeout mặc định"
                value={`${capabilities.data?.resource_limits.default_timeout_ms ?? 0} ms`}
              />
              <InfoTile
                label="Memory mặc định"
                value={`${capabilities.data?.resource_limits.default_memory_mb ?? 0} MB`}
              />
              <InfoTile
                label="CPU mặc định"
                value={String(capabilities.data?.resource_limits.default_cpu_cap ?? 0)}
              />
              <InfoTile
                label="Catalog cache"
                value={`${health.data?.cache.catalog.hits ?? 0} hit(s)`}
              />
            </div>
            <div>
              <div className="font-semibold text-text">Features</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(capabilities.data?.features ?? []).map((feature) => (
                  <Badge key={feature} value={feature} tone="default" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="section-title">Recent Session Runs</div>
            <div className="mt-1 text-lg font-semibold">Local history chỉ nằm trong trình duyệt</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRuns.length ? (
              recentRuns.map((item) => (
                <Link
                  key={item.id}
                  to={`/runs/session/${item.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-panelAlt p-4 transition hover:border-accent/30"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <Badge value={item.result.status} tone={item.result.status === "success" ? "success" : "danger"} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoTile label="Avg Runtime" value={formatDuration(item.result.summary.avg_runtime_ms)} />
                    <InfoTile label="Peak Memory" value={formatMemory(item.result.summary.peak_memory_mb)} />
                    <InfoTile label="Risk Score" value={String(item.result.insights.risk_score)} />
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">
                Chưa có run nào trong session hiện tại. Chạy simulation để tạo local history tạm thời.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="section-title">Latest Analyze Snapshot</div>
              <div className="mt-1 text-lg font-semibold">Code insight gần nhất</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {latestAnalyze ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge
                      value={`Risk ${latestAnalyze.insights.risk_score}`}
                      tone={
                        latestAnalyze.insights.risk_score >= 70
                          ? "danger"
                          : latestAnalyze.insights.risk_score >= 40
                            ? "warning"
                            : "success"
                      }
                    />
                    <Badge value={latestAnalyze.report.cache_hit ? "cache hit" : "fresh"} tone="default" />
                  </div>
                  <p className="leading-6 text-muted">{latestAnalyze.insights.explanation}</p>
                </>
              ) : (
                <p className="text-muted">Chưa có kết quả analyze trong session.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="section-title">Latest Compare</div>
              <div className="mt-1 text-lg font-semibold">So sánh gần nhất</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {latestCompare ? (
                <>
                  <InfoTile
                    label="Faster Label"
                    value={latestCompare.comparison.faster_label ?? "--"}
                  />
                  <InfoTile
                    label="Lower Memory"
                    value={latestCompare.comparison.lower_memory_label ?? "--"}
                  />
                  <InfoTile
                    label="Risk Delta"
                    value={String(latestCompare.comparison.risk_score_delta ?? "--")}
                  />
                </>
              ) : (
                <p className="text-muted">Chưa có compare result nào được lưu ở session.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MetricPanel({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="section-title">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-sm leading-6 text-muted">{hint}</p>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="panel-muted p-4">
      <div className="mb-3 inline-flex rounded-xl border border-accent/20 bg-accent/10 p-2 text-accent">{icon}</div>
      <div className="font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panelAlt p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-2 font-semibold text-text">{value}</div>
    </div>
  );
}
