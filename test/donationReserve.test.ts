import { describe, expect, it } from 'vitest';

import {
  isNativeToken,
  reserveShortfall,
  XLM_MINIMUM_RESERVE,
  XLM_SAFE_BALANCE_FLOOR,
  RESERVE_EXPLANATION,
} from '@/lib/donationReserve';

const XLM = (whole: number) => BigInt(whole) * XLM_MINIMUM_RESERVE;

describe('reserveShortfall', () => {
  it('returns null when the donation leaves the reserve intact', () => {
    expect(reserveShortfall(XLM(8), XLM(10), { native: true })).toBeNull();
  });

  it('allows a donation that lands exactly on the reserve floor', () => {
    expect(
      reserveShortfall(XLM(10) - XLM_SAFE_BALANCE_FLOOR, XLM(10), { native: true }),
    ).toBeNull();
  });

  it('reports the gap when the donation would eat into the reserve', () => {
    // Donating 9.05 XLM of a 10 XLM balance leaves 0.95 XLM, which is
    // 0.06 XLM short of the 1.01 XLM floor.
    const gap = reserveShortfall(XLM(10) - XLM(1) + 500_000n, XLM(10), { native: true });

    expect(gap).toBe(600_000n);
  });

  it('flags donating the entire visible balance', () => {
    const gap = reserveShortfall(XLM(10), XLM(10), { native: true });

    expect(gap).toBe(XLM_SAFE_BALANCE_FLOOR);
  });

  it('ignores non-native tokens', () => {
    expect(reserveShortfall(XLM(10), XLM(10), { native: false })).toBeNull();
  });

  it('ignores an unknown balance and non-positive amounts', () => {
    expect(reserveShortfall(XLM(10), null, { native: true })).toBeNull();
    expect(reserveShortfall(0n, XLM(10), { native: true })).toBeNull();
  });

  it('uses the XLM floor unless a caller overrides it', () => {
    expect(reserveShortfall(XLM(1), XLM(10), { native: true, floor: XLM(6) })).toBeNull();
    expect(reserveShortfall(XLM(5), XLM(10), { native: true, floor: XLM(6) })).toBe(XLM(1));
    expect(reserveShortfall(XLM(9), XLM(10), { native: true, floor: XLM(6) })).toBe(XLM(5));
  });
});

describe('isNativeToken', () => {
  it('matches XLM case- and space-insensitively', () => {
    expect(isNativeToken('XLM')).toBe(true);
    expect(isNativeToken(' xlm ')).toBe(true);
    expect(isNativeToken('USDC')).toBe(false);
  });
});

describe('RESERVE_EXPLANATION', () => {
  it('explains the reserve in one plain sentence', () => {
    expect(RESERVE_EXPLANATION.split('.').filter(Boolean)).toHaveLength(1);
    expect(RESERVE_EXPLANATION).toContain('1 XLM');
  });
});
