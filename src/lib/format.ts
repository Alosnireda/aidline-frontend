import { config } from './config';

/**
 * Formats a token amount given in the smallest unit (a string or bigint, as
 * the API returns it) without ever converting through a JS number.
 */
export function formatAmount(
  raw: string | bigint,
  opts: { decimals?: number; maxFraction?: number; symbol?: boolean } = {},
): string {
  const decimals = opts.decimals ?? config.tokenDecimals;
  const maxFraction = opts.maxFraction ?? 2;
  const value = BigInt(raw);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);

  const whole = (abs / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let fraction = (abs % base).toString().padStart(decimals, '0').slice(0, maxFraction);
  fraction = fraction.replace(/0+$/, '');

  const text = `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
  return opts.symbol === false ? text : `${text} ${config.tokenSymbol}`;
}

/** Parses a user typed amount like "12.5" into the smallest unit. Returns null if invalid. */
export function parseAmount(input: string, decimals = config.tokenDecimals): bigint | null {
  const trimmed = input.trim().replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) return null;
  const [, whole, fraction = ''] = match;
  if (fraction.length > decimals) return null;
  return BigInt(whole!) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
}

export function capAmount(amount: bigint, limit: bigint | null): bigint {
  return limit !== null && limit < amount ? limit : amount;
}

export function amountInput(amount: bigint): string {
  return formatAmount(amount, { symbol: false, maxFraction: config.tokenDecimals }).replace(
    /,/g,
    '',
  );
}

/** Share of `part` in `total` as a 0 to 100 number, safe for bigint strings. */
export function percent(part: string | bigint, total: string | bigint): number {
  const t = BigInt(total);
  if (t === 0n) return 0;
  return Number((BigInt(part) * 10_000n) / t) / 100;
}

export function shortAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 1) return address;
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Formats a date as "03 Oct 2026". Pass an Intl locale tag to use another language's month names. */
export function formatDate(iso: string | Date, intlLocale?: string): string {
  if (!intlLocale) return dateFmt.format(new Date(iso));
  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export type DeadlineParts =
  | { kind: 'ended' }
  | { kind: 'today' }
  | { kind: 'days'; days: number };

/** The deadline as data, so each language can word it: ended, ends today, or N whole days left. */
export function deadlineParts(iso: string, now = new Date()): DeadlineParts {
  const ms = new Date(iso).getTime() - now.getTime();
  if (ms < 0) return { kind: 'ended' };
  const days = Math.floor(ms / 86_400_000);
  return days === 0 ? { kind: 'today' } : { kind: 'days', days };
}

/** "12 days left", "Ends today", "Ended 3 Oct 2026" */
export function deadlineLabel(iso: string, now = new Date()): string {
  const parts = deadlineParts(iso, now);
  if (parts.kind === 'ended') return `Ended ${formatDate(iso)}`;
  if (parts.kind === 'today') return 'Ends today';
  return `${parts.days} day${parts.days === 1 ? '' : 's'} left`;
}

/**
 * Splits campaign description text into paragraphs on blank lines.
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
