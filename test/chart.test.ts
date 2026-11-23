import { describe, expect, it } from 'vitest';

import {
  computeChartPoints,
  formatAxisValue,
  labelIndices,
  tickLabel,
  toTokenUnits,
  toXlm,
} from '@/lib/chart';

const geometry = {
  width: 600,
  height: 240,
  paddingLeft: 60,
  paddingRight: 20,
  paddingTop: 20,
  paddingBottom: 40,
};

describe('toTokenUnits', () => {
  it('uses the given decimals', () => {
    expect(toTokenUnits('12500000', 7)).toBe(1.25);
    expect(toTokenUnits('1250000', 6)).toBe(1.25);
    expect(toTokenUnits(undefined, 6)).toBe(0);
  });
});

describe('computeChartPoints', () => {
  it('places points correctly for a token with 6 decimals', () => {
    const { maxVal, plotted } = computeChartPoints(
      [
        { date: 'Start', donated: '0', released: '0' },
        { date: 'Now', donated: '1000000000', released: '500000000' }, // 1,000 and 500 tokens
      ],
      geometry,
      6,
    );
    expect(maxVal).toBe(1000);
    // chart area: x 60..580, y 20..200
    expect(plotted[0]).toEqual({ x: 60, donatedY: 200, releasedY: 200 });
    expect(plotted[1]).toEqual({ x: 580, donatedY: 20, releasedY: 110 });
  });

  it('gives the same picture for the same token amounts at 7 decimals', () => {
    const six = computeChartPoints(
      [{ date: 'Now', donated: '1000000000', released: '500000000' }],
      geometry,
      6,
    );
    const seven = computeChartPoints(
      [{ date: 'Now', donated: '10000000000', released: '5000000000' }],
      geometry,
      7,
    );
    expect(six).toEqual(seven);
  });
});

describe('formatAxisValue', () => {
  it('adds thousands separators', () => {
    expect(formatAxisValue(12500)).toBe('12,500');
    expect(formatAxisValue(1234567.4)).toBe('1,234,567');
    expect(formatAxisValue(0)).toBe('0');
  });
});

describe('toXlm', () => {
  it('keeps the fraction of an amount under one XLM', () => {
    expect(toXlm('500000')).toBe(0.05);
    expect(toXlm('1')).toBe(0.0000001);
    expect(toXlm('1500000')).toBe(0.15);
  });

  it('converts whole and fractional amounts together', () => {
    expect(toXlm('12345678')).toBeCloseTo(1.2345678, 7);
    expect(toXlm('1200000000')).toBe(120);
  });

  it('treats a missing value as zero', () => {
    expect(toXlm(undefined)).toBe(0);
    expect(toXlm('')).toBe(0);
  });

  it('does not collapse large totals to zero', () => {
    expect(toXlm('900000000000000')).toBe(90_000_000);
  });
});

describe('labelIndices', () => {
  it('labels every point when they all fit', () => {
    expect(labelIndices(1)).toEqual([0]);
    expect(labelIndices(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('thins a month of snapshots and keeps the ends', () => {
    const indices = labelIndices(30);
    expect(indices.length).toBeLessThanOrEqual(7);
    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(29);
    expect(new Set(indices).size).toBe(indices.length);
    expect([...indices].sort((a, b) => a - b)).toEqual(indices);
  });

  it('thins a quarter of snapshots and keeps the ends', () => {
    const indices = labelIndices(90);
    expect(indices.length).toBeLessThanOrEqual(7);
    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(89);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it('returns nothing for an empty chart', () => {
    expect(labelIndices(0)).toEqual([]);
  });
});

describe('tickLabel', () => {
  it('keeps whole numbers whole', () => {
    expect(tickLabel(0)).toBe('0');
    expect(tickLabel(25)).toBe('25');
    expect(tickLabel(1234.6)).toBe('1235');
  });

  it('shows two decimals on small axes', () => {
    expect(tickLabel(0.5)).toBe('0.5');
    expect(tickLabel(0.25)).toBe('0.25');
    expect(tickLabel(1)).toBe('1');
  });
});
