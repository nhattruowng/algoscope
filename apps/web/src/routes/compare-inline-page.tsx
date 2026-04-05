import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { ArrowLeftRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { CompareInlineRequest, ScenarioPreset } from "@algoscope/shared-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useScenarioPresets } from "@/hooks/use-scenario-presets";
import { api } from "@/lib/api";
import { formatCpu, formatDuration, formatMemory } from "@/lib/format";
import { comparisonToChart, compareSimulations } from "@/lib/metrics";
import { applyScenarioPreset, defaultScenario, parseInputSizes } from "@/lib/scenario";
import { saveLatestCompareResult } from "@/lib/session-result";

const leftStarter = `def solve(data):
    return sum(data)
`;

const rightStarter = `def solve(data):
    return sorted(data)
`;

export function CompareInlinePage() {
  const presets = useScenarioPresets();
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [payload, setPayload] = useState<CompareInlineRequest>({
    left: {
      label: "Implementation A",
      language: "python",
      entrypoint: "solve",
      code: leftStarter,
    },
    right: {
      label: "Implementation B",
      language: "python",
      entrypoint: "solve",
      code: rightStarter,
    },
    scenario: defaultScenario,
  });

  const mutation = useMutation({
    mutationFn: () => api.compareInline(payload),
    onSuccess: (result) => saveLatestCompareResult(result),
  });

  const delta = useMemo(
    () => compareSimulations(mutation.data?.left, mutation.data?.right),
    [mutation.data?.left, mutation.data?.right],
  );
  const chartData = useMemo(() => comparisonToChart(mutation.data), [mutation.data]);

  function applyPreset(preset: ScenarioPreset) {
    setSelectedPresetId(preset.id);
    setPayload({ ...payload, scenario: applyScenarioPreset(preset) });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-line bg-panel/95 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="section-title mb-2">Compare Inline</div>
          <h1 className="text-3xl font-semibold tracking-tight">So sánh hai đoạn mã trong một request stateless</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Dùng chung một scenario để xem chênh lệch runtime, memory, CPU và risk score mà không cần lưu run trên
            server.
          </p>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {mutation.isPending ? "Comparing..." : "Compare Inline"}
        </Button>
      </section>

      <Card>
        <CardHeader>
          <div className="section-title">Shared Scenario</div>
          <div className="mt-1 text-lg font-semibold">Cấu hình benchmark dùng chung</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Input
              value={payload.scenario.input_sizes.join(",")}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  scenario: { ...payload.scenario, input_sizes: parseInputSizes(event.target.value) },
                })
              }
            />
            <Input
              type="number"
              value={payload.scenario.iterations}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  scenario: { ...payload.scenario, iterations: Number(event.target.value) },
                })
              }
            />
            <Input
              type="number"
              value={payload.scenario.timeout_ms}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  scenario: { ...payload.scenario, timeout_ms: Number(event.target.value) },
                })
              }
            />
            <Input
              type="number"
              value={payload.scenario.memory_cap_mb}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  scenario: { ...payload.scenario, memory_cap_mb: Number(event.target.value) },
                })
              }
            />
            <Select
              value={payload.scenario.data_shape}
              onChange={(event) =>
                setPayload({
                  ...payload,
                  scenario: {
                    ...payload.scenario,
                    data_shape: event.target.value as CompareInlineRequest["scenario"]["data_shape"],
                  },
                })
              }
            >
              <option value="random">Random</option>
              <option value="sorted">Sorted</option>
              <option value="reverse">Reverse</option>
              <option value="duplicate-heavy">Duplicate-heavy</option>
              <option value="custom">Custom</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={selectedPresetId}
              onChange={(event) => {
                const preset = presets.data?.find((item) => item.id === event.target.value);
                if (preset) {
                  applyPreset(preset);
                  return;
                }
                setSelectedPresetId("");
              }}
              className="max-w-sm"
            >
              <option value="">Chọn preset</option>
              {(presets.data ?? []).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </Select>
            {(presets.data ?? []).map((preset) => (
              <Button key={preset.id} variant="secondary" onClick={() => applyPreset(preset)}>
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <EditorCard
          title="Implementation A"
          label={payload.left.label}
          entrypoint={payload.left.entrypoint ?? ""}
          code={payload.left.code}
          onLabelChange={(value) => setPayload({ ...payload, left: { ...payload.left, label: value } })}
          onEntrypointChange={(value) => setPayload({ ...payload, left: { ...payload.left, entrypoint: value } })}
          onCodeChange={(value) => setPayload({ ...payload, left: { ...payload.left, code: value } })}
        />
        <EditorCard
          title="Implementation B"
          label={payload.right.label}
          entrypoint={payload.right.entrypoint ?? ""}
          code={payload.right.code}
          onLabelChange={(value) => setPayload({ ...payload, right: { ...payload.right, label: value } })}
          onEntrypointChange={(value) => setPayload({ ...payload, right: { ...payload.right, entrypoint: value } })}
          onCodeChange={(value) => setPayload({ ...payload, right: { ...payload.right, code: value } })}
        />
      </section>

      {mutation.data ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <DeltaCard
              label="Runtime Delta"
              value={formatDuration(delta.runtimeDelta)}
              tone={delta.runtimeDirection === "improved" ? "success" : "danger"}
            />
            <DeltaCard
              label="Memory Delta"
              value={formatMemory(delta.memoryDelta)}
              tone={delta.memoryDirection === "improved" ? "success" : "danger"}
            />
            <DeltaCard label="CPU Delta" value={formatCpu(delta.cpuDelta)} tone="default" />
            <DeltaCard
              label="Risk Delta"
              value={String(delta.riskDelta)}
              tone={delta.riskDirection === "improved" ? "success" : "danger"}
            />
            <DeltaCard label="Faster" value={mutation.data.comparison.faster_label ?? "--"} tone="default" />
          </section>

          <Card>
            <CardHeader>
              <div className="section-title">Comparison Charts</div>
              <div className="mt-1 text-lg font-semibold">Average runtime, peak memory và risk score</div>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-3">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#1d3445" strokeDasharray="4 4" />
                  <XAxis dataKey="name" stroke="#8da3b7" />
                  <YAxis stroke="#8da3b7" />
                  <Tooltip />
                  <Bar dataKey="runtime" fill="#5ec2ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#1d3445" strokeDasharray="4 4" />
                  <XAxis dataKey="name" stroke="#8da3b7" />
                  <YAxis stroke="#8da3b7" />
                  <Tooltip />
                  <Bar dataKey="memory" fill="#67d39b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#1d3445" strokeDasharray="4 4" />
                  <XAxis dataKey="name" stroke="#8da3b7" />
                  <YAxis stroke="#8da3b7" />
                  <Tooltip />
                  <Bar dataKey="risk" fill="#f6ad55" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <section className="grid gap-6 xl:grid-cols-2">
            <ResultCard
              title={payload.left.label}
              runtime={mutation.data.left.summary.avg_runtime_ms}
              memory={mutation.data.left.summary.peak_memory_mb}
              riskScore={mutation.data.left.insights.risk_score}
              warnings={mutation.data.left.insights.warnings}
            />
            <ResultCard
              title={payload.right.label}
              runtime={mutation.data.right.summary.avg_runtime_ms}
              memory={mutation.data.right.summary.peak_memory_mb}
              riskScore={mutation.data.right.insights.risk_score}
              warnings={mutation.data.right.insights.warnings}
            />
          </section>
        </>
      ) : null}

      {mutation.error ? <p className="text-sm text-danger">{String(mutation.error)}</p> : null}
    </div>
  );
}

function EditorCard({
  title,
  label,
  entrypoint,
  code,
  onLabelChange,
  onEntrypointChange,
  onCodeChange,
}: {
  title: string;
  label: string;
  entrypoint: string;
  code: string;
  onLabelChange: (value: string) => void;
  onEntrypointChange: (value: string) => void;
  onCodeChange: (value: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="section-title">{title}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Label" />
          <Input value={entrypoint} onChange={(event) => onEntrypointChange(event.target.value)} placeholder="Entrypoint" />
        </div>
        <Editor
          height="420px"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
          options={{ minimap: { enabled: false }, fontSize: 13, lineHeight: 22 }}
        />
      </CardContent>
    </Card>
  );
}

function ResultCard({
  title,
  runtime,
  memory,
  riskScore,
  warnings,
}: {
  title: string;
  runtime?: number | null;
  memory?: number | null;
  riskScore: number;
  warnings: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="section-title">{title}</div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile label="Average runtime" value={formatDuration(runtime)} />
          <InfoTile label="Peak memory" value={formatMemory(memory)} />
          <InfoTile label="Risk score" value={String(riskScore)} />
        </div>
        <div>
          <div className="font-semibold text-text">Warnings</div>
          <div className="mt-2 space-y-2">
            {warnings.length ? (
              warnings.map((warning, index) => (
                <div key={index} className="rounded-xl border border-line bg-panelAlt p-3">
                  {warning}
                </div>
              ))
            ) : (
              <p>Không có warning nào.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaCard({ label, value, tone }: { label: string; value: string; tone: "default" | "success" | "danger" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-text";
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="section-title">{label}</div>
        <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
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
