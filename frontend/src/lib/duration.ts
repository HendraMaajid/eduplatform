const DURATION_AMOUNT_PATTERN = /\d+(?:[.,]\d+)?/;

export function durationAmount(value?: string | null): string {
  const match = value?.match(DURATION_AMOUNT_PATTERN)?.[0];
  return match ? match.replace(",", ".") : "";
}

function formatDuration(value: string, unit: "Minggu" | "Jam"): string {
  const amount = Number(durationAmount(value));
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return `${amount} ${unit}`;
}

export function formatCourseDuration(value: string): string {
  return formatDuration(value, "Minggu");
}

export function formatModuleDuration(value: string): string {
  return formatDuration(value, "Jam");
}
