import { describe, expect, it } from 'vitest';

import { verifierAvailability } from '@/lib/verifiers';

describe('verifierAvailability', () => {
  it('reports an unreachable API as unavailable, not empty', () => {
    expect(verifierAvailability(null)).toBe('unavailable');
  });

  it('reports a reachable but empty list as empty', () => {
    expect(verifierAvailability({ items: [] })).toBe('empty');
  });

  it('reports a populated list as ready', () => {
    expect(verifierAvailability({ items: [{ address: 'GABC' }] })).toBe('ready');
  });
});
