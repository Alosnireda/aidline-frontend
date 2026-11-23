import { describe, expect, it } from 'vitest';

import { availablePresets, DEFAULT_DONATION, initialDonateInput } from '@/lib/donateAmount';
import { parseAmount } from '@/lib/format';

const PRESETS = ['10', '50', '100'];

describe('initialDonateInput', () => {
  it('starts at 50 when at least 50 is still needed', () => {
    expect(initialDonateInput(500_000_000n)).toBe(DEFAULT_DONATION);
    expect(initialDonateInput(2_000_000_000n)).toBe(DEFAULT_DONATION);
  });

  it('starts at the exact remaining amount when less than 50 is needed', () => {
    expect(initialDonateInput(200_000_000n)).toBe('20');
    expect(initialDonateInput(12_345_678n)).toBe('1.2345678');
    expect(initialDonateInput(1n)).toBe('0.0000001');
  });

  it('always produces an amount the form will accept', () => {
    for (const remaining of [1n, 7n, 123_456_789n, 499_999_999n, 500_000_000n]) {
      expect(parseAmount(initialDonateInput(remaining))).toBe(remaining);
    }
  });

  it('uses the configured token decimals', () => {
    expect(initialDonateInput(1_250_000n, 6)).toBe('1.25');
  });
});

describe('availablePresets', () => {
  it('hides presets larger than what is still needed', () => {
    expect(availablePresets(PRESETS, 200_000_000n)).toEqual(['10']);
    expect(availablePresets(PRESETS, 1_000_000_000n)).toEqual(PRESETS);
    expect(availablePresets(PRESETS, 20_000_000n)).toEqual([]);
  });
});
