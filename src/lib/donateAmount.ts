import { config } from './config';
import { formatAmount, parseAmount } from './format';

export const DEFAULT_DONATION = '50';

/** Starts at 50 tokens, or at the exact amount still needed when that is smaller. */
export function initialDonateInput(remaining: bigint, decimals = config.tokenDecimals): string {
  if (remaining <= 0n) return '0';
  const cap = parseAmount(DEFAULT_DONATION, decimals)!;
  const amount = remaining < cap ? remaining : cap;
  return formatAmount(amount, { decimals, symbol: false, maxFraction: decimals }).replace(/,/g, '');
}

/** Hides presets that could never be accepted because they exceed the remaining goal. */
export function availablePresets(
  presets: readonly string[],
  remaining: bigint,
  decimals = config.tokenDecimals,
): string[] {
  return presets.filter((preset) => {
    const amount = parseAmount(preset, decimals);
    return amount !== null && amount <= remaining;
  });
}
