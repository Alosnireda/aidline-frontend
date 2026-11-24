import { describe, expect, it } from 'vitest';

import {
  addDays,
  deadlineEndUtc,
  deadlineHint,
  defaultDeadline,
  localDate,
  minimumDeadline,
} from '@/lib/deadline';

describe('deadline dates', () => {
  const morningInSydney = new Date('2026-11-24T20:30:00Z');
  const utcPlusEleven = -660;

  it('uses the creator calendar day in a time zone ahead of UTC', () => {
    expect(localDate(morningInSydney, utcPlusEleven)).toBe('2026-11-25');
    expect(minimumDeadline(morningInSydney, utcPlusEleven)).toBe('2026-11-26');
    expect(defaultDeadline(morningInSydney, utcPlusEleven)).toBe('2026-12-25');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('stores the deadline at the end of the chosen UTC day', () => {
    expect(deadlineEndUtc('2026-11-26').toISOString()).toBe('2026-11-26T23:59:59.000Z');
  });

  it('explains the UTC end and shows the matching local time', () => {
    const hint = deadlineHint('2026-11-26', utcPlusEleven);
    expect(hint).toContain('23:59 UTC');
    expect(hint).toContain('Nov 27');
    expect(hint).toContain('10:59');
  });
});
