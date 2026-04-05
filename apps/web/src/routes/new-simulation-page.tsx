import { useMutation } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { Play, SearchCode } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { ScenarioPreset, SimulationRequest } from "@algoscope/shared-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCapabilities } from "@/hooks/use-capabilities";
import { useScenarioPresets } from "@/hooks/use-scenario-presets";
import { api } from "@/lib/api";
import { applyScenarioPreset, defaultScenario, parseInputSizes } from "@/lib/scenario";
import { saveSimulationSession } from "@/lib/session-result";

const starterCode = `def solve(data):
    total = 0
    for value in data:
        total += value
    return total
`;

export function NewSimulationPage() {
  const navigate = useNavigate();
  const presets = useScenarioPresets();
  const capabilities = useCapabilities();

  const [title, setTitle] = useState("Array workload benchmark");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [form, setForm] = useState<SimulationRequest>({
    language: "python",
    entrypoint: "solve",
    profile_label: "array-workload-benchmark",
    code: starterCode,
    scenario: defaultScenario,
  });
  const [customData, setCustomData] = useState("");

  const selectedPreset = useMemo(
    () => presets.data?.find((item) => item.id === selectedPresetId) ?? null,
    [presets.data, selectedPresetId],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: SimulationRequest = {
        ...form,
        profile_label: form.profile_label || title,
        scenario: {
          ...form.scenario,
          custom_data: customData.trim() ? JSON.parse(customData) : null,
        },
      };
      return api.simulate(payload);
    },
    onSuccess: (result) => {
      const record = saveSimulationSession(result, title);
      navigate(`/runs/session/${record.id}`);
    },
  });

  function applyPreset(preset: ScenarioPreset) {
    setSelectedPresetId(preset.id);
    setForm({ ...form, scenario: applyScenarioPreset(preset) });
    setCustomData(preset.scenario.custom_data ? JSON.stringify(preset.scenario.custom_data, null, 2) : "");
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-line bg-panel/95 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="section-title mb-2">New Simulation</div>
          <h1 className="text-3xl font-semibold tracking-tight">Chạy benchmark trực tiếp trong sandbox</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Tối ưu theo flow senior-level hơn: preset scenario, profile label, capability hint và session history cục
            bộ để bạn quay lại những lần chạy gần nhất ngay trên frontend.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/analyze">
            <Button variant="secondary">
              <SearchCode className="mr-2 h-4 w-4" />
              Analyze Only
            </Button>
          </Link>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            <Play className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Running..." : "Run Simulation"}
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="section-title">Code Editor</div>
            <div className="mt-1 text-lg font-semibold">{title}</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề mô phỏng" />
              <Input
                value={form.profile_label ?? ""}
                onChange={(event) => setForm({ ...form, profile_label: event.target.value })}
                placeholder="Profile label"
              />
              <Input
                value={form.entrypoint ?? ""}
                onChange={(event) => setForm({ ...form, entrypoint: event.target.value })}
                placeholder="Entrypoint"
              />
            </div>
            <Editor
              height="520px"
              defaultLanguage="python"
              theme="vs-dark"
              value={form.code}
              onChange={(value) => setForm({ ...form, code: value ?? "" })}
              options={{
                fontSize: 13,
                lineHeight: 22,
                minimap: { enabled: false },
                roundedSelection: false,
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="section-title">Scenario Presets</div>
              <div className="mt-1 text-lg font-semibold">Chọn nhanh hồ sơ benchmark</div>
            </CardHeader>
            <CardContent className="space-y-4">
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
              >
                <option value="">Chọn preset</option>
                {(presets.data ?? []).map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </Select>
              <div className="grid gap-3">
                {(presets.data ?? []).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-2xl border border-line bg-panelAlt p-4 text-left transition hover:border-accent/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{preset.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {preset.tags.map((tag) => (
                          <Badge key={tag} value={tag} tone="default" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{preset.description}</p>
                  </button>
                ))}
              </div>
              {selectedPreset ? (
                <p className="text-sm text-muted">
                  Đang dùng preset <span className="font-semibold text-text">{selectedPreset.name}</span>.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="section-title">Runtime Configuration</div>
              <div className="mt-1 text-lg font-semibold">Giới hạn sandbox</div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <Input
                value={form.scenario.input_sizes.join(",")}
                onChange={(event) =>
                  setForm({
                    ...form,
                    scenario: { ...form.scenario, input_sizes: parseInputSizes(event.target.value) },
                  })
                }
                placeholder="100,1000,5000"
              />
              <Input
                type="number"
                value={form.scenario.iterations}
                onChange={(event) =>
                  setForm({ ...form, scenario: { ...form.scenario, iterations: Number(event.target.value) } })
                }
                placeholder="Iterations"
              />
              <Input
                type="number"
                value={form.scenario.random_seed}
                onChange={(event) =>
                  setForm({ ...form, scenario: { ...form.scenario, random_seed: Number(event.target.value) } })
                }
                placeholder="Random seed"
              />
              <Input
                type="number"
                value={form.scenario.timeout_ms}
                onChange={(event) =>
                  setForm({ ...form, scenario: { ...form.scenario, timeout_ms: Number(event.target.value) } })
                }
                placeholder="Timeout (ms)"
              />
              <Input
                type="number"
                value={form.scenario.memory_cap_mb}
                onChange={(event) =>
                  setForm({ ...form, scenario: { ...form.scenario, memory_cap_mb: Number(event.target.value) } })
                }
                placeholder="Memory cap (MB)"
              />
              <Input
                type="number"
                step="0.25"
                value={form.scenario.cpu_cap}
                onChange={(event) =>
                  setForm({ ...form, scenario: { ...form.scenario, cpu_cap: Number(event.target.value) } })
                }
                placeholder="CPU cap"
              />
              <Select
                value={form.scenario.data_shape}
                onChange={(event) =>
                  setForm({
                    ...form,
                    scenario: {
                      ...form.scenario,
                      data_shape: event.target.value as SimulationRequest["scenario"]["data_shape"],
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
              <Textarea
                value={customData}
                onChange={(event) => setCustomData(event.target.value)}
                rows={6}
                placeholder='Optional custom JSON, ví dụ {"values":[1,2,3]}'
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="section-title">Scenario Preview</div>
              <div className="mt-1 text-lg font-semibold">Execution matrix</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <p>
                {form.scenario.iterations} iteration(s) trên {form.scenario.input_sizes.length} input size(s), timeout{" "}
                {form.scenario.timeout_ms} ms.
              </p>
              <p>
                Memory limit {form.scenario.memory_cap_mb} MB, CPU cap {form.scenario.cpu_cap}, data shape{" "}
                {form.scenario.data_shape}.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge value={`Default timeout ${capabilities.data?.resource_limits.default_timeout_ms ?? 0} ms`} tone="default" />
                <Badge value={`Default memory ${capabilities.data?.resource_limits.default_memory_mb ?? 0} MB`} tone="default" />
                <Badge value={`Default CPU ${capabilities.data?.resource_limits.default_cpu_cap ?? 0}`} tone="default" />
              </div>
              <p className="rounded-xl border border-line bg-panelAlt p-3 font-mono text-xs text-text">
                {JSON.stringify(form.scenario, null, 2)}
              </p>
              {mutation.error ? <p className="text-danger">{String(mutation.error)}</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
