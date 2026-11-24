import { describe, expect, it } from 'vitest';

import {
  NO_RATES,
  RATES_MAX_AGE_MS,
  afterFetchFailure,
  afterFetchSuccess,
  stroopsToFiat,
} from '@/lib/fiat';

describe('stroopsToFiat', () => {
  it('treats API amount strings as stroops, not whole XLM', () => {
    // 300 XLM at 0.20 USD is 60 USD.
    expect(stroopsToFiat('3000000000', 0.2, 'USD')).toBe('~ $60.00');
  });

  it('accepts bigint amounts from the donate form', () => {
    expect(stroopsToFiat(500_000_000n, 0.2, 'USD')).toBe('~ $10.00');
  });

  it('shows small values with more precision', () => {
    expect(stroopsToFiat('10000000', 0.123456, 'USD')).toBe('~ $0.1235');
  });

  it('returns null for zero, negative or invalid amounts', () => {
    expect(stroopsToFiat('0', 0.2, 'USD')).toBeNull();
    expect(stroopsToFiat('-5', 0.2, 'USD')).toBeNull();
    expect(stroopsToFiat('abc', 0.2, 'USD')).toBeNull();
  });
});

describe('rate refresh failures', () => {
  const rates = { usd: 0.2, eur: 0.18, gbp: 0.15, ngn: 300 };
  const T0 = 1_700_000_000_000;

  it('a success stores the rates with their fetch time', () => {
    expect(afterFetchSuccess(rates, T0)).toEqual({ rates, fetchedAt: T0 });
  });

  it('keeps the last good rates when a refresh fails after a success', () => {
    const good = afterFetchSuccess(rates, T0);
    const after = afterFetchFailure(good, T0 + 60_000);
    expect(after.rates).toEqual(rates);
    expect(after.fetchedAt).toBe(T0);
  });

  it('keeps them through repeated failures until the age limit', () => {
    const good = afterFetchSuccess(rates, T0);
    let state = good;
    for (let minute = 1; minute <= 10; minute++) {
      state = afterFetchFailure(state, T0 + minute * 60_000);
    }
    expect(state.rates).toEqual(rates);
  });

  it('drops rates older than the limit', () => {
    const good = afterFetchSuccess(rates, T0);
    expect(afterFetchFailure(good, T0 + RATES_MAX_AGE_MS).rates).toEqual(rates);
    expect(afterFetchFailure(good, T0 + RATES_MAX_AGE_MS + 1)).toEqual(NO_RATES);
  });

  it('stays empty when there never was a good fetch', () => {
    expect(afterFetchFailure(NO_RATES, T0)).toEqual(NO_RATES);
  });

  it('a later success replaces stale rates and resets the clock', () => {
    const fresh = { ...rates, usd: 0.25 };
    const state = afterFetchSuccess(fresh, T0 + RATES_MAX_AGE_MS + 5_000);
    expect(afterFetchFailure(state, T0 + RATES_MAX_AGE_MS + 65_000).rates).toEqual(fresh);
  });

  it('still converts with the kept rates after a failure', () => {
    const kept = afterFetchFailure(afterFetchSuccess(rates, T0), T0 + 60_000).rates!;
    expect(stroopsToFiat('3000000000', kept.usd, 'USD')).toBe('~ $60.00');
  });
});
