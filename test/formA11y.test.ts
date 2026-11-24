import { describe, expect, it } from 'vitest';

import { errorFieldId, errorSummary, fieldA11y, fieldErrorId, fieldHintId } from '@/lib/formA11y';

describe('fieldA11y', () => {
  it('marks a field invalid and links its error', () => {
    expect(
      fieldA11y('title', { title: 'Use at least 5 characters.' }, fieldHintId('title')),
    ).toEqual({
      'aria-invalid': true,
      'aria-describedby': fieldErrorId('title'),
    });
  });

  it('keeps the hint linked when there is no error', () => {
    expect(fieldA11y('organizer', {}, fieldHintId('organizer'))).toEqual({
      'aria-describedby': 'organizer-hint',
    });
  });

  it('returns nothing for a field with neither error nor hint', () => {
    expect(fieldA11y('summary', {})).toEqual({});
  });

  it('links milestone errors through the shared error map', () => {
    expect(fieldA11y('m1', { m1: 'Enter an amount greater than zero.' })).toEqual({
      'aria-invalid': true,
      'aria-describedby': 'm1-error',
    });
  });
});

describe('errorFieldId', () => {
  it('maps plain field keys to their control id', () => {
    expect(errorFieldId('beneficiary')).toBe('beneficiary');
    expect(errorFieldId('deadline')).toBe('deadline');
  });

  it('maps milestone keys to their input ids', () => {
    expect(errorFieldId('m0')).toBe('milestone-0');
    expect(errorFieldId('m12')).toBe('milestone-12');
  });
});

describe('errorSummary', () => {
  it('counts the fields that need attention', () => {
    expect(errorSummary(3)).toBe('3 fields need attention');
  });

  it('uses the singular for one field', () => {
    expect(errorSummary(1)).toBe('1 field needs attention');
  });

  it('stays quiet when nothing failed', () => {
    expect(errorSummary(0)).toBe('');
  });
});
