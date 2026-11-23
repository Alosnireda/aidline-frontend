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
