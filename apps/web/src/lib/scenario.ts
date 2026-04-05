import type { ScenarioConfig, ScenarioPreset } from "@algoscope/shared-types";

export const defaultScenario: ScenarioConfig = {
  input_sizes: [100, 1000, 5000],
  iterations: 3,
  random_seed: 42,
  timeout_ms: 3000,
  memory_cap_mb: 256,
  cpu_cap: 1,
  data_shape: "reverse",
  custom_data: null,
};

export function parseInputSizes(value: string): number[] {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => !Number.isNaN(item) && item > 0);
}

export function applyScenarioPreset(preset: ScenarioPreset): ScenarioConfig {
  return {
    ...preset.scenario,
    custom_data: preset.scenario.custom_data ?? null,
  };
}
