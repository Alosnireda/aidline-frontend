import { explorer } from '@/lib/config';
import { formatAmount, shortAddress } from '@/lib/format';
import type { SponsorPoolData } from '@/lib/stellar/balance';

function matchingRuleText(pool: SponsorPoolData): string {
  const pct =
    pool.ratioBps % 100 === 0 ? String(pool.ratioBps / 100) : (pool.ratioBps / 100).toFixed(2);
  if (pool.remaining <= 0n) {
    return `This pool matched donations at ${pct}% up to ${formatAmount(pool.cap)}, and has now been fully used.`;
  }
  if (pool.ratioBps === 10_000) {
    return `Every eligible donation is matched 1:1 (100%) up to ${formatAmount(pool.cap)} while funds remain in the pool.`;
  }
  return `Every eligible donation is matched at ${pct}% up to ${formatAmount(pool.cap)} while funds remain in the pool.`;
}

export function SponsorPool({ pool }: { pool: SponsorPoolData | null | undefined }) {
  if (!pool) return null;

  return (
    <section className="border-l-2 border-ink pl-4">
      <p className="kicker">Sponsor matching</p>
      <p className="mt-2 text-[0.9375rem] text-ink">{matchingRuleText(pool)}</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Sponsor</dt>
          <dd>
            <a
              href={explorer.account(pool.sponsor)}
              target="_blank"
              rel="noreferrer"
              className="link figure"
            >
              {shortAddress(pool.sponsor, 5)}
            </a>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Left in pool</dt>
          <dd className="figure text-ink">
            {formatAmount(pool.remaining)} of {formatAmount(pool.cap)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
