export function formatNumber(value?: number | null, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return value.toFixed(digits);
}

export function formatDuration(value?: number | null): string {
  return value === null || value === undefined ? "--" : `${formatNumber(value)} ms`;
}

export function formatMemory(value?: number | null): string {
  return value === null || value === undefined ? "--" : `${formatNumber(value)} MB`;
}

export function formatCpu(value?: number | null): string {
  return value === null || value === undefined ? "--" : `${formatNumber(value)}%`;
}
