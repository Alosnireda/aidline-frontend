import { describe, expect, it } from 'vitest';

import {
  isProofSelectionValid,
  PROOF_UPLOAD_ACCEPT,
  proofUploadErrors,
  proofUploadHint,
  PROOF_UPLOAD_LIMITS,
} from '@/lib/proofUpload';

const png = { name: 'receipt.png', size: 1000, type: 'image/png' };
const pdf = { name: 'invoice.pdf', size: 2000, type: 'application/pdf' };

describe('proofUploadHint', () => {
  it('is derived from the shared limits', () => {
    expect(proofUploadHint()).toContain(`Up to ${PROOF_UPLOAD_LIMITS.maxFiles} files`);
    expect(proofUploadHint()).toContain('5 MB each');
    expect(PROOF_UPLOAD_ACCEPT).toBe('image/jpeg,image/png,image/webp,application/pdf');
  });
});

describe('proofUploadErrors', () => {
  it('accepts supported files within the limits', () => {
    expect(proofUploadErrors([png, pdf])).toEqual([]);
    expect(isProofSelectionValid([png, pdf])).toBe(true);
  });

  it('reports too many files', () => {
    const files = Array.from({ length: PROOF_UPLOAD_LIMITS.maxFiles + 1 }, (_, i) => ({
      ...png,
      name: `photo-${i}.png`,
    }));
    expect(proofUploadErrors(files)).toEqual(['Choose no more than 5 files.']);
    expect(isProofSelectionValid(files)).toBe(false);
  });

  it('reports an oversized file with its size', () => {
    const large = { ...png, size: PROOF_UPLOAD_LIMITS.maxFileSizeBytes + 1 };
    expect(proofUploadErrors([large])).toEqual(['receipt.png: 5.1 MB is over the 5 MB limit.']);
  });

  it('reports unsupported types', () => {
    const gif = { name: 'animation.gif', size: 100, type: 'image/gif' };
    expect(proofUploadErrors([gif])).toEqual([
      'animation.gif: unsupported file type. Use JPEG, PNG, WebP or PDF.',
    ]);
  });
});
