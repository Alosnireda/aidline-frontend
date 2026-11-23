'use client';

import { useEffect, useState } from 'react';

import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import { api, donorPosition, type CampaignDetail, type DonorPosition } from '@/lib/api';
import { formatAmount } from '@/lib/format';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

/** Shown on cancelled or expired campaigns so donors can reclaim unspent funds. */
export function RefundPanel({ campaign }: { campaign: CampaignDetail }) {
  const { address, sign } = useWallet();
  const { state, run, busy } = useTx();
  const [lookup, setLookup] = useState<{
    key: string;
    position: DonorPosition | null;
    error: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const phaseKey = JSON.stringify(state.phase);
  const lookupKey = `${address ?? ''}:${campaign.id}:${phaseKey}:${retry}`;

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    api
      .donor(address)
      .then((history) => {
        if (cancelled) return;
        setLookup({ key: lookupKey, position: donorPosition(history, campaign.id), error: false });
      })
      .catch(() => {
        if (cancelled) return;
        setLookup({ key: lookupKey, position: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [address, campaign.id, lookupKey, phaseKey, retry]);

  const reason =
    campaign.status === 'cancelled'
      ? 'This campaign was cancelled.'
      : 'This campaign ended before every milestone was verified.';

  const unknown = (
    <p className="text-[0.9375rem]">
      {reason} Donors can reclaim their share of the funds that were never released.
      {!address && ' Connect the wallet you donated with to check yours.'}
    </p>
  );

  if (!address) return unknown;

  const current = lookup?.key === lookupKey ? lookup : null;
  if (current?.error) {
    return (
      <div>
        <p role="alert" className="text-[0.9375rem] text-danger">
          The refund amount could not be loaded.
        </p>
        <button
          type="button"
          className="btn btn-secondary mt-4"
          onClick={() => setRetry((n) => n + 1)}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!current?.position || current.position.given === 0n) return unknown;
  const position = current.position;

  const raised = BigInt(campaign.raised);
  const unreleased = raised - BigInt(campaign.released);
  const estimate = raised > 0n ? (position.given * unreleased) / raised : 0n;

  if (position.refunded > 0n) {
    return (
      <p className="text-[0.9375rem]">
        {reason} You reclaimed{' '}
        <span className="figure text-ink">{formatAmount(position.refunded)}</span>.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[0.9375rem]">
        {reason} You gave <span className="figure text-ink">{formatAmount(position.given)}</span>.
        Your share of what was never released is{' '}
        <span className="figure text-ink">{formatAmount(estimate)}</span>.
      </p>
      <button
        type="button"
        className="btn btn-primary mt-5 w-full"
        disabled={busy || estimate === 0n}
        onClick={() =>
          void run(
            (on) => aidline.refund(address, campaign.id, sign, on),
            async () => {
              const h = await api.donor(address);
              return h.refunds.some((r) => r.campaignId === campaign.id);
            },
          )
        }
      >
        Reclaim {formatAmount(estimate)}
      </button>
      <TxStatus state={state} success="Your unspent share has been returned to your wallet." />
    </div>
  );
}
