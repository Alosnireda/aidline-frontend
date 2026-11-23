import { describe, expect, it } from 'vitest';

import { safeExternalUrl } from '@/lib/url';

describe('safeExternalUrl', () => {
  it('keeps http and https URLs', () => {
    expect(safeExternalUrl('https://example.org/about')).toBe('https://example.org/about');
    expect(safeExternalUrl('http://example.org')).toBe('http://example.org/');
    expect(safeExternalUrl('  https://example.org  ')).toBe('https://example.org/');
  });

  it('rejects javascript: URLs, whatever their case or padding', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(safeExternalUrl('JavaScript:alert(1)')).toBeNull();
    expect(safeExternalUrl(' javascript:alert(1)')).toBeNull();
  });

  it('rejects data: URLs', () => {
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('rejects relative URLs', () => {
    expect(safeExternalUrl('/admin')).toBeNull();
    expect(safeExternalUrl('example.org')).toBeNull();
    expect(safeExternalUrl('//example.org')).toBeNull();
  });

  it('rejects empty values and other protocols', () => {
    expect(safeExternalUrl(undefined)).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl('')).toBeNull();
    expect(safeExternalUrl('ftp://example.org')).toBeNull();
    expect(safeExternalUrl('mailto:a@example.org')).toBeNull();
  });
});
