'use client';

import type { CampaignKind } from '@/lib/api';
import { useFiat } from '@/lib/fiat';
import { formatAmount, percent } from '@/lib/format';

import { KIND } from './kind';

interface Props {
  kind: CampaignKind;
  goal: string;
  raised: string;
  released: string;
  refunded?: string;
  size?: 'sm' | 'lg';
  showFigures?: boolean;
}

/**
 * Three segments: released (solid), held in escrow (hatched), still needed
 * (empty). Refunded amounts are removed from escrow when provided. See DESIGN.md, "Funding bar".
 */
export function FundingBar({
  kind,
  goal,
  raised,
  released,
  refunded = '0',
  size = 'sm',
  showFigures = true,
}: Props) {
  const { formatFiat } = useFiat();
  const k = KIND[kind];
  const goalAmount = BigInt(goal);
  const raisedAmount = BigInt(raised);
  const releasedAmount = BigInt(released);
  const refundedAmount = BigInt(refunded);
  const escrowAmount =
    raisedAmount - releasedAmount - refundedAmount > 0n
      ? raisedAmount - releasedAmount - refundedAmount
      : 0n;
  const neededAmount = goalAmount - raisedAmount > 0n ? goalAmount - raisedAmount : 0n;
  const escrow = escrowAmount.toString();
  const needed = neededAmount.toString();

  const rawReleasedPct = percent(releasedAmount, goalAmount);
  const rawEscrowPct = percent(escrowAmount, goalAmount);
  const totalPct = rawReleasedPct + rawEscrowPct;
  const scale = totalPct > 100 && totalPct > 0 ? 100 / totalPct : 1;
  const releasedPct = rawReleasedPct * scale;
  const escrowPct = rawEscrowPct * scale;

  const releasedFiat = formatFiat(releasedAmount.toString());
  const escrowFiat = formatFiat(escrowAmount.toString());
  const goalFiat = formatFiat(goalAmount.toString());

  const refundedLabel =
    refundedAmount > 0n ? `, ${formatAmount(refundedAmount.toString())} refunded` : '';
  const label = `${formatAmount(releasedAmount.toString())} released, ${formatAmount(escrow)} in escrow${refundedLabel}, ${formatAmount(needed)} still needed of ${formatAmount(goalAmount.toString())}`;

  return (
    <div>
      <div
        role="img"
        aria-label={label}
        className={`flex w-full overflow-hidden border border-rule ${size === 'lg' ? 'h-4' : 'h-2.5'}`}
      >
        <div
          className={`${k.bg} transition-[width] duration-200`}
          style={{ width: `${releasedPct}%` }}
        />
        <div
          className={`hatch ${k.text} transition-[width] duration-200`}
          style={{ width: `${escrowPct}%` }}
        />
      </div>
      {showFigures && (
        <dl
          className={`figure mt-2.5 grid grid-cols-3 gap-2 ${size === 'lg' ? 'text-sm' : 'text-[0.8125rem]'}`}
        >
          <div>
            <dt className="flex items-center gap-1.5 font-sans text-[0.6875rem] uppercase tracking-wider text-ink-muted">
              <span className={`inline-block h-2 w-2 ${k.bg}`} aria-hidden="true" />
              Released
            </dt>
            <dd className="mt-0.5 text-ink">
              {formatAmount(releasedAmount.toString())}
              {releasedFiat && (
                <span className="block font-mono text-[0.75rem] text-ink-muted">
                  {releasedFiat}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 font-sans text-[0.6875rem] uppercase tracking-wider text-ink-muted">
              <span className={`hatch inline-block h-2 w-2 ${k.text}`} aria-hidden="true" />
              In escrow
            </dt>
            <dd className="mt-0.5 text-ink">
              {formatAmount(escrow)}
              {escrowFiat && (
                <span className="block font-mono text-[0.75rem] text-ink-muted">{escrowFiat}</span>
              )}
            </dd>
          </div>
          <div className="text-right">
            <dt className="font-sans text-[0.6875rem] uppercase tracking-wider text-ink-muted">
              Goal
            </dt>
            <dd className="mt-0.5 text-ink">
              {formatAmount(goalAmount.toString())}
              {goalFiat && (
                <span className="block font-mono text-[0.75rem] text-ink-muted">{goalFiat}</span>
              )}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
