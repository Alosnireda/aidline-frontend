import { config } from './config';

/**
 * A Stellar account must keep a minimum reserve to stay active. One XLM covers
 * the account itself plus its first trustline, which is the floor Aidline uses.
 */
export const XLM_MINIMUM_RESERVE = 10_000_000n; // 1 XLM in stroops

/** Headroom for the network fee and for any entry a donation may create. */
export const XLM_FEE_MARGIN = 100_000n; // 0.01 XLM in stroops

/** Balance that must stay untouched in a native XLM wallet. */
export const XLM_SAFE_BALANCE_FLOOR = XLM_MINIMUM_RESERVE + XLM_FEE_MARGIN;

/** One plain sentence explaining why part of the balance cannot be donated. */
export const RESERVE_EXPLANATION =
  'A Stellar wallet has to keep at least 1 XLM plus a small fee margin to stay active, so that part of your balance cannot be donated.';

export function isNativeToken(symbol: string = config.tokenSymbol): boolean {
  return symbol.trim().toUpperCase() === 'XLM';
}

/**
 * How far a donation would push the wallet below the reserve floor.
 *
 * Returns `null` when the donation is safe, when the balance is unknown, or
 * when the campaign token is not native XLM (reserves only apply to XLM).
 */
export function reserveShortfall(
  amount: bigint,
  balance: bigint | null,
  options: { native?: boolean; floor?: bigint } = {},
): bigint | null {
  const { native = isNativeToken(), floor = XLM_SAFE_BALANCE_FLOOR } = options;
  if (!native || balance === null || amount <= 0n) return null;

  const remaining = balance - amount;
  return remaining < floor ? floor - remaining : null;
}
