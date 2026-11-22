import { describe, it, expect } from 'vitest';

// #147: Pure funding bar arithmetic extracted from FundingBar.tsx
export function fundingBreakdown(goal: string, raised: string, released: string) {
  const g = BigInt(goal), r = BigInt(raised), rel = BigInt(released);
  const escrow = r - rel;
  const needed = g - r;
  return { escrow: escrow.toString(), needed: needed.toString() };
}

describe('fundingBreakdown', () => {
  it('empty campaign: all needed', () => {
    const r = fundingBreakdown('1000', '0', '0');
    expect(r.escrow).toBe('0');
    expect(r.needed).toBe('1000');
  });
  it('half funded: half escrow, half needed', () => {
    const r = fundingBreakdown('1000', '500', '0');
    expect(r.escrow).toBe('500');
    expect(r.needed).toBe('500');
  });
  it('fully released: zero escrow, zero needed', () => {
    const r = fundingBreakdown('1000', '1000', '1000');
    expect(r.escrow).toBe('0');
    expect(r.needed).toBe('0');
  });
  it('raised equals goal: zero needed', () => {
    const r = fundingBreakdown('1000', '1000', '0');
    expect(r.escrow).toBe('1000');
    expect(r.needed).toBe('0');
  });
});
