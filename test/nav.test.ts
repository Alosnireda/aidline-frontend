import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({ default: () => null }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { isNavCurrent } from '@/components/layout/NavLinks';

describe('isNavCurrent', () => {
  it('matches exact nav paths', () => {
    expect(isNavCurrent('/campaigns', '/campaigns')).toBe(true);
    expect(isNavCurrent('/verifiers', '/verifiers')).toBe(true);
    expect(isNavCurrent('/how-it-works', '/how-it-works')).toBe(true);
    expect(isNavCurrent('/start', '/start')).toBe(true);
  });

  it('matches campaign detail pages under Campaigns', () => {
    expect(isNavCurrent('/campaigns/abc-123', '/campaigns')).toBe(true);
    expect(isNavCurrent('/campaigns/abc-123', '/verifiers')).toBe(false);
  });

  it('does not match unrelated or partial prefix paths', () => {
    expect(isNavCurrent('/', '/campaigns')).toBe(false);
    expect(isNavCurrent('/donors/GABC', '/campaigns')).toBe(false);
    expect(isNavCurrent('/campaigns-archive', '/campaigns')).toBe(false);
    expect(isNavCurrent(null, '/campaigns')).toBe(false);
  });
});
