export function parseCsvNumbers(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
}

export function toCsv(value: number[]): string | null {
  return value.length ? value.join(",") : null;
}