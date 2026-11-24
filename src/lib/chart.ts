import { config } from './config';

export interface ChartSnapshot {
  date: string;
  donated: string;
  released: string;
}

/**
 * Converts an amount in the token's smallest unit to whole tokens as a
 * number for plotting. Missing values count as zero so one bad row cannot
 * crash the page.
 */
export function toTokenUnits(raw: string | undefined, decimals = config.tokenDecimals): number {
  const value = BigInt(raw ?? '0');
  const base = 10n ** BigInt(decimals);
  // Whole part through bigint keeps large totals exact; the fraction only
  // needs to be close enough to place a point on the chart.
  return Number(value / base) + Number(value % base) / Number(base);
}

export interface ChartGeometry {
  width: number;
  height: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
}

export interface PlottedPoint {
  x: number;
  donatedY: number;
  releasedY: number;
}

/** Smallest top of the value axis, in whole tokens, so tiny totals still draw a sensible chart. */
export const MIN_AXIS_MAX = 100;

export function computeChartPoints(
  points: ChartSnapshot[],
  geometry: ChartGeometry,
  decimals = config.tokenDecimals,
): { maxVal: number; plotted: PlottedPoint[] } {
  const chartW = geometry.width - geometry.paddingLeft - geometry.paddingRight;
  const chartH = geometry.height - geometry.paddingTop - geometry.paddingBottom;
  const maxVal = Math.max(
    ...points.flatMap((p) => [
      toTokenUnits(p.donated, decimals),
      toTokenUnits(p.released, decimals),
    ]),
    MIN_AXIS_MAX,
  );
  const getX = (i: number) => geometry.paddingLeft + (i / (points.length - 1 || 1)) * chartW;
  const getY = (raw: string) =>
    geometry.paddingTop + chartH - (toTokenUnits(raw, decimals) / maxVal) * chartH;
  return {
    maxVal,
    plotted: points.map((p, i) => ({
      x: getX(i),
      donatedY: getY(p.donated),
      releasedY: getY(p.released),
    })),
  };
}

const axisFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Axis tick label with thousands separators, e.g. "12,500". */
export function formatAxisValue(value: number): string {
  return axisFormat.format(Math.round(value));
}

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
