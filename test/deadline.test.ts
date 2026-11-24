import { describe, expect, it } from 'vitest';

import { deadlineLabel, deadlineParts, formatDate } from '@/lib/format';

const now = new Date('2026-10-03T12:00:00Z');

describe('deadlineParts', () => {
  it('reports whole days left', () => {
    expect(deadlineParts('2026-10-10T12:00:00Z', now)).toEqual({ kind: 'days', days: 7 });
    expect(deadlineParts('2026-10-04T13:00:00Z', now)).toEqual({ kind: 'days', days: 1 });
  });

  it('reports a deadline within the next day as today', () => {
    expect(deadlineParts('2026-10-03T18:00:00Z', now)).toEqual({ kind: 'today' });
    expect(deadlineParts('2026-10-03T12:00:00Z', now)).toEqual({ kind: 'today' });
  });

  it('reports a deadline in the past as ended', () => {
    expect(deadlineParts('2026-10-03T11:59:59Z', now)).toEqual({ kind: 'ended' });
    expect(deadlineParts('2026-01-01T00:00:00Z', now)).toEqual({ kind: 'ended' });
  });

  it('agrees with deadlineLabel in every case', () => {
    expect(deadlineLabel('2026-10-10T12:00:00Z', now)).toBe('7 days left');
    expect(deadlineLabel('2026-10-04T13:00:00Z', now)).toBe('1 day left');
    expect(deadlineLabel('2026-10-03T18:00:00Z', now)).toBe('Ends today');
    expect(deadlineLabel('2026-10-01T00:00:00Z', now)).toBe('Ended 01 Oct 2026');
  });
});

describe('formatDate', () => {
  it('keeps the existing English style without a locale', () => {
    expect(formatDate('2026-10-03T00:00:00Z')).toBe('03 Oct 2026');
  });

  it('uses the month names of the language asked for', () => {
    expect(formatDate('2026-10-03T00:00:00Z', 'en-GB')).toBe('03 Oct 2026');
    expect(formatDate('2026-03-07T00:00:00Z', 'fr-FR')).toMatch(/^07 mars 2026$/);
    expect(formatDate('2026-03-07T00:00:00Z', 'es-ES')).toMatch(/^07 mar\.? 2026$/);
  });

  it('reads the date in UTC, so it does not slip a day with the reader\'s time zone', () => {
    expect(formatDate('2026-10-03T23:30:00Z', 'fr-FR')).toMatch(/^03 oct\.? 2026$/);
  });
});
