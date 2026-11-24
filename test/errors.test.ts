import { describe, expect, it } from 'vitest';

import { describeError, VERIFIER_ADMIN_ERRORS } from '@/lib/stellar/errors';

describe('describeError', () => {
  it('maps contract error codes to plain sentences', () => {
    expect(describeError(new Error('HostError: Error(Contract, #8)'))).toMatch(/past its goal/);
    expect(describeError(new Error('Error(Contract, #11)'))).toMatch(/Refunds open/);
  });

  it('explains wallet rejections', () => {
    expect(describeError(new Error('User declined access'))).toBe(
      'The request was declined in your wallet.',
    );
  });

  it('passes through unknown errors, trimmed', () => {
    expect(describeError('boom')).toBe('boom');
    expect(describeError(new Error('x'.repeat(300))).length).toBeLessThanOrEqual(201);
  });
});

describe('describeError with per-call contract errors', () => {
  it('uses the overrides for verifier admin calls', () => {
    expect(
      describeError(new Error('HostError: Error(Contract, #9)'), VERIFIER_ADMIN_ERRORS),
    ).toMatch(/new verifier is not registered/);
    expect(describeError(new Error('Error(Contract, #40)'), VERIFIER_ADMIN_ERRORS)).toMatch(
      /maximum number of times/,
    );
    expect(describeError(new Error('Error(Contract, #1)'), VERIFIER_ADMIN_ERRORS)).toMatch(
      /admin wallet/,
    );
  });

  it('falls back to the default table and plain text for codes it does not cover', () => {
    expect(describeError(new Error('Error(Contract, #11)'), VERIFIER_ADMIN_ERRORS)).toMatch(
      /Refunds open/,
    );
    expect(describeError(new Error('User declined access'), VERIFIER_ADMIN_ERRORS)).toBe(
      'The request was declined in your wallet.',
    );
  });
});

describe('contract error codes 1 to 26', () => {
  const raw = (code: number) => `HostError: Error(Contract, #${code})`;

  it('describes the sponsor pool, bond, pledge and emergency advance errors', () => {
    expect(describeError(new Error(raw(14)))).toMatch(/already has a sponsor matching pool/);
    expect(describeError(new Error(raw(15)))).toMatch(/no sponsor matching pool/);
    expect(describeError(new Error(raw(16)))).toMatch(/matching settings are not valid/);
    expect(describeError(new Error(raw(17)))).toMatch(/cannot be returned yet/);
    expect(describeError(new Error(raw(24)))).toMatch(/not an emergency campaign/);
    expect(describeError(new Error(raw(25)))).toMatch(/already taken its emergency advance/);
    expect(describeError(new Error(raw(26)))).toMatch(/larger than the amount held in escrow/);
  });

  it('gives every code from 1 to 26 a sentence instead of the raw host error', () => {
    for (let code = 1; code <= 26; code++) {
      const text = describeError(new Error(raw(code)));
      expect(text, `code ${code}`).not.toContain('HostError');
      expect(text, `code ${code}`).not.toContain('Error(Contract');
      expect(text.length, `code ${code}`).toBeGreaterThan(10);
    }
  });

  it('keeps the interface voice: no exclamation marks and no emoji in any sentence', () => {
    for (let code = 1; code <= 26; code++) {
      const text = describeError(new Error(raw(code)));
      expect(text, `code ${code}`).not.toMatch(/!/);
      expect(text, `code ${code}`).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
