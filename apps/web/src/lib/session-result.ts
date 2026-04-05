import type { AnalyzeResponse, CompareInlineResponse, SimulationResponse } from "@algoscope/shared-types";

const LATEST_RESULT_KEY = "algoscope.latestSimulationResult";
const RECENT_RUNS_KEY = "algoscope.recentSimulationRuns";
const LATEST_ANALYZE_KEY = "algoscope.latestAnalyzeResult";
const LATEST_COMPARE_KEY = "algoscope.latestCompareResult";
const MAX_RECENT_RUNS = 8;

export interface SessionRunRecord {
  id: string;
  title: string;
  created_at: string;
  result: SimulationResponse;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
}

export function saveSimulationSession(result: SimulationResponse, title: string): SessionRunRecord {
  const record: SessionRunRecord = {
    id: makeId(),
    title,
    created_at: new Date().toISOString(),
    result,
  };

  sessionStorage.setItem(LATEST_RESULT_KEY, JSON.stringify(record));

  const recent = getRecentSimulationSessions();
  const next = [record, ...recent].slice(0, MAX_RECENT_RUNS);
  sessionStorage.setItem(RECENT_RUNS_KEY, JSON.stringify(next));

  return record;
}

export function getLatestSimulationResult(): SimulationResponse | null {
  return getLatestSimulationSession()?.result ?? null;
}

export function getLatestSimulationSession(): SessionRunRecord | null {
  return safeParse<SessionRunRecord>(sessionStorage.getItem(LATEST_RESULT_KEY));
}

export function getRecentSimulationSessions(): SessionRunRecord[] {
  return safeParse<SessionRunRecord[]>(sessionStorage.getItem(RECENT_RUNS_KEY)) ?? [];
}

export function getSimulationSessionById(id: string): SessionRunRecord | null {
  return getRecentSimulationSessions().find((item) => item.id === id) ?? null;
}

export function clearSimulationSessions() {
  sessionStorage.removeItem(LATEST_RESULT_KEY);
  sessionStorage.removeItem(RECENT_RUNS_KEY);
}

export function saveLatestAnalyzeResult(result: AnalyzeResponse) {
  sessionStorage.setItem(LATEST_ANALYZE_KEY, JSON.stringify(result));
}

export function getLatestAnalyzeResult(): AnalyzeResponse | null {
  return safeParse<AnalyzeResponse>(sessionStorage.getItem(LATEST_ANALYZE_KEY));
}

export function saveLatestCompareResult(result: CompareInlineResponse) {
  sessionStorage.setItem(LATEST_COMPARE_KEY, JSON.stringify(result));
}

export function getLatestCompareResult(): CompareInlineResponse | null {
  return safeParse<CompareInlineResponse>(sessionStorage.getItem(LATEST_COMPARE_KEY));
}
