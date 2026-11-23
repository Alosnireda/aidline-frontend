import { describe, expect, it } from 'vitest';

import { refundEstimate } from '@/lib/refund';

describe('refundEstimate', () => {
  it('matches the contract formula and rounds down', () => {
    expect(refundEstimate(3n, 7n, 2n)).toBe(2n);
    expect(refundEstimate(250n, 1000n, 400n)).toBe(150n);
    expect(refundEstimate(150_000_000n, 1_000_000_000n, 400_000_000n)).toBe(90_000_000n);
  });

  it('returns zero for empty, fully released or already refunded positions', () => {
    expect(refundEstimate(0n, 1000n, 400n)).toBe(0n);
    expect(refundEstimate(100n, 0n, 0n)).toBe(0n);
    expect(refundEstimate(100n, 1000n, 1000n)).toBe(0n);
    expect(refundEstimate(100n, 1000n, 1200n)).toBe(0n);
    expect(refundEstimate(-1n, 1000n, 400n)).toBe(0n);
  });
});
