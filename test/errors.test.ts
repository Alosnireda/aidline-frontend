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
