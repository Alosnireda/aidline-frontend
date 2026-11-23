/** Mirrors the contract's `contribution * (raised - released) / raised`, rounded down. */
export function refundEstimate(contribution: bigint, raised: bigint, released: bigint): bigint {
  if (contribution <= 0n || raised <= 0n) return 0n;
  const unreleased = raised - released;
  if (unreleased <= 0n) return 0n;
  return (contribution * unreleased) / raised;
}
