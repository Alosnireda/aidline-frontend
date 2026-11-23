import { describe, expect, it } from 'vitest';

import { applicationErrors } from '@/lib/applicationErrors';

describe('applicationErrors', () => {
  it('maps each issue to its field using the visible label', () => {
    const result = applicationErrors([
      { path: 'orgName', message: 'String must contain at least 2 character(s)' },
      { path: 'website', message: 'Invalid url' },
      { path: 'description', message: 'String must contain at least 20 character(s)' },
    ]);
    expect(result.fields).toEqual({
      orgName: 'Organisation must be at least 2 characters.',
      website: 'Website must be a full web address, like https://example.org.',
      description: 'How you verify work on the ground must be at least 20 characters.',
    });
    expect(result.general).toEqual([]);
  });

  it('never shows the internal field name', () => {
    const { fields } = applicationErrors([{ path: 'orgName', message: 'Already taken' }]);
    expect(fields.orgName).toBe('Organisation: already taken.');
    expect(fields.orgName).not.toMatch(/orgName/);
  });

  it('handles nested paths and keeps the first issue per field', () => {
    const { fields } = applicationErrors([
      { path: 'body.country', message: 'Required' },
      { path: 'country', message: 'String must contain at most 56 character(s)' },
    ]);
    expect(fields).toEqual({ country: 'Country is required.' });
  });

  it('puts unknown paths in the general list', () => {
    const result = applicationErrors([
      { path: 'address', message: 'This wallet already has a pending application' },
      { path: '', message: 'Too many requests' },
    ]);
    expect(result.fields).toEqual({});
    expect(result.general).toEqual([
      'This wallet already has a pending application',
      'Too many requests',
    ]);
  });
});
