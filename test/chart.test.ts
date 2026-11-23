import { describe, expect, it } from 'vitest';

import { computeChartPoints, formatAxisValue, toTokenUnits } from '@/lib/chart';

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
