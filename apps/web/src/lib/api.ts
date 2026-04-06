import type {
  AnalyzeResponse,
  AnalysisRequest,
  CapabilitiesResponse,
  CompareInlineRequest,
  CompareInlineResponse,
  HealthResponse,
  ScenarioPreset,
  SimulationRequest,
  SimulationResponse,
} from "@algoscope/shared-types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  simulate: (payload: SimulationRequest) =>
    request<SimulationResponse>("/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  analyze: (payload: AnalysisRequest) =>
    request<AnalyzeResponse>("/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  compareInline: (payload: CompareInlineRequest) =>
    request<CompareInlineResponse>("/compare-inline", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getScenarioPresets: () => request<ScenarioPreset[]>("/scenario-presets"),
  getCapabilities: () => request<CapabilitiesResponse>("/capabilities"),
  health: () => request<HealthResponse>("/health"),
};
