/**
 * Helpers for the donation and release chart. They live here so the arithmetic
 * can be unit tested without rendering SVG.
 */

const STROOPS_PER_XLM = 10_000_000;

/**
 * Stroops to XLM, keeping the fraction. Values are plotted, not printed, so a
 * JS number is enough: even a very large total only loses a fraction of a
 * pixel of height to floating point.
 */
export function toXlm(stroops: string | undefined): number {
  if (!stroops) return 0;
  return Number(BigInt(stroops)) / STROOPS_PER_XLM;
}

/**
 * The point indexes that should carry a date label. Labels are thinned as
 * snapshots pile up, but the first and last point always keep theirs.
 */
export function labelIndices(count: number, maxLabels = 7): number[] {
  if (count <= 0) return [];
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i);

  const step = Math.ceil((count - 1) / (maxLabels - 1));
  const indices: number[] = [];
  for (let i = 0; i < count - 1; i += step) indices.push(i);
  indices.push(count - 1);
  return indices;
}

/** Axis tick text: whole numbers for ordinary totals, two decimals for small ones. */
export function tickLabel(value: number): string {
  if (value >= 10) return String(Math.round(value));
  return value.toFixed(2).replace(/\.?0+$/, '') || '0';
}
