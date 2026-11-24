/** Distinguishes a failed verifier lookup from a genuinely empty list (#98). */
export type VerifierAvailability = 'unavailable' | 'empty' | 'ready';

/**
 * `safe(api.verifiers)` returns `null` when the API could not be reached, which
 * must not be presented as "no verifiers are registered".
 */
export function verifierAvailability(result: { items: unknown[] } | null): VerifierAvailability {
  if (result === null) return 'unavailable';
  return result.items.length === 0 ? 'empty' : 'ready';
}
