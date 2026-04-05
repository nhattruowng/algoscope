export type Language = "python";
export type SimulationStatus = "success" | "error";
export type HeatmapMode = "time" | "memory" | "risk";
export type Severity = "low" | "medium" | "high";

export interface ScenarioConfig {
  input_sizes: number[];
  iterations: number;
  random_seed: number;
  timeout_ms: number;
  memory_cap_mb: number;
  cpu_cap: number;
  data_shape: "random" | "sorted" | "reverse" | "duplicate-heavy" | "custom";
  custom_data?: Record<string, unknown> | null;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  scenario: ScenarioConfig;
  tags: string[];
}

export interface SimulationRequest {
  language: Language;
  code: string;
  entrypoint?: string | null;
  profile_label?: string | null;
  scenario: ScenarioConfig;
}

export interface AnalysisRequest {
  language: Language;
  code: string;
  entrypoint?: string | null;
  profile_label?: string | null;
}

export interface CompareCodeInput {
  label: string;
  language: Language;
  code: string;
  entrypoint?: string | null;
}

export interface CompareInlineRequest {
  left: CompareCodeInput;
  right: CompareCodeInput;
  scenario: ScenarioConfig;
}

export interface Recommendation {
  title: string;
  detail: string;
  category: "time" | "memory" | "risk" | "readability";
  priority: "low" | "medium" | "high";
}

export interface CodeAnnotation {
  line_start: number;
  line_end: number;
  severity: Severity;
  category: HeatmapMode;
  message: string;
  weights: Record<HeatmapMode, number>;
}

export interface Hotspot {
  line_start: number;
  line_end: number;
  severity: Severity;
  type: HeatmapMode;
  label: string;
}

export interface Insights {
  explanation: string;
  detected_entrypoint?: string | null;
  warnings: string[];
  hotspots: Hotspot[];
  complexity_hints: string[];
  annotations: CodeAnnotation[];
  recommendations: Recommendation[];
  risk_score: number;
}

export interface SampleResult {
  input_size: number;
  iteration_index: number;
  runtime_ms: number;
  memory_mb: number;
  cpu_percent: number;
  exit_code: number;
  timeout_triggered: boolean;
}

export interface InputSizeResult {
  input_size: number;
  avg_runtime_ms: number;
  peak_memory_mb: number;
  cpu_avg_percent: number;
  samples: SampleResult[];
}

export interface SimulationSummary {
  avg_runtime_ms?: number | null;
  peak_memory_mb?: number | null;
  cpu_avg_percent?: number | null;
  total_runtime_ms?: number | null;
  p95_runtime_ms?: number | null;
}

export interface ExecutionMetadata {
  timeout_triggered: boolean;
  memory_limit_mb: number;
  cpu_limit: number;
  network_disabled: boolean;
  runtime_info: Record<string, string | number | boolean | null | undefined>;
}

export interface ReportResponse {
  generated_at: string;
  export_filename: string;
  profile_label?: string | null;
  cache_hit: boolean;
}

export interface SimulationResponse {
  status: SimulationStatus;
  summary: SimulationSummary;
  results: InputSizeResult[];
  stdout: string;
  stderr: string;
  exit_code: number;
  insights: Insights;
  execution: ExecutionMetadata;
  report: ReportResponse;
}

export interface AnalyzeResponse {
  status: "success";
  insights: Insights;
  report: ReportResponse;
}

export interface ComparisonSummary {
  avg_runtime_delta_ms?: number | null;
  peak_memory_delta_mb?: number | null;
  cpu_avg_delta_percent?: number | null;
  faster_label?: string | null;
  lower_memory_label?: string | null;
  risk_score_delta?: number | null;
}

export interface CompareInlineResponse {
  status: "success";
  left: SimulationResponse;
  right: SimulationResponse;
  comparison: ComparisonSummary;
}

export interface CapabilitiesResponse {
  stateless: boolean;
  supported_languages: Language[];
  features: string[];
  resource_limits: {
    default_timeout_ms: number;
    default_memory_mb: number;
    default_cpu_cap: number;
    network_disabled_by_default: boolean;
  };
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
}

export interface HealthResponse {
  status: "ok";
  mode: "stateless";
  sandbox_image: string;
  supported_languages: Language[];
  cache: {
    analysis: CacheStats;
    catalog: CacheStats;
  };
}
