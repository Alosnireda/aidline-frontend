'use client';

import { useEffect, useState } from 'react';

import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import type { CampaignDetail } from '@/lib/api';
import { config } from '@/lib/config';
import { formatAmount, parseAmount } from '@/lib/format';
import { getSponsorPool, type SponsorPoolData } from '@/lib/stellar/balance';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

import { SponsorPool } from './SponsorPool';

const RATIO_PRESETS = ['25', '50', '100'];

/** Parses a percentage string like "50" or "12.5" into basis points (1..10000). */
function parseRatioBps(input: string): number | null {
  const trimmed = input.trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const whole = Number(match[1]);
  const frac = Number((match[2] ?? '').padEnd(2, '0'));
  const bps = whole * 100 + frac;
  if (!Number.isInteger(bps) || bps < 1 || bps > 10_000) return null;
  return bps;
}

export function SponsorPoolPanel({
  campaign,
  initialPool,
}: {
  campaign: CampaignDetail;
  initialPool: SponsorPoolData | null;
}) {
  const { address, state: wallet, balance, connect, sign, refreshBalance } = useWallet();
  const { state, run, reset, busy } = useTx();

  const [pool, setPool] = useState<SponsorPoolData | null>(initialPool);
  const [amountInput, setAmountInput] = useState('100');
  const [ratioInput, setRatioInput] = useState('100');
  const [lastAction, setLastAction] = useState<'deposit' | 'return'>('deposit');

  useEffect(() => {
    setPool(initialPool);
  }, [initialPool]);

  useEffect(() => {
    if (!address || !config.contractId) return;
    let cancelled = false;
    getSponsorPool(campaign.id, address)
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setPool(found);
        } else if (pool?.sponsor === address) {
          setPool(null);
        }
      })
      .catch(() => {
        // Keep existing pool state if RPC read fails.
      });
    return () => {
      cancelled = true;
    };
  }, [address, campaign.id, pool?.sponsor]);

  const campaignEnded =
    campaign.status !== 'active' || new Date(campaign.deadline).getTime() <= Date.now();
  const isSponsor = Boolean(pool && address && pool.sponsor === address);
  const canReturn = Boolean(pool && isSponsor && campaignEnded && pool.remaining > 0n);
  const canDeposit = campaign.status === 'active' && !campaignEnded && !isSponsor;

  const amount = parseAmount(amountInput);
  const ratioBps = parseRatioBps(ratioInput);

  const amountError =
    amount === null
      ? 'Enter an amount like 100 or 25.5.'
      : amount <= 0n
        ? 'Enter an amount greater than zero.'
        : balance !== null && amount > balance
          ? `Your wallet holds ${formatAmount(balance)}.`
          : null;

  const ratioError =
    ratioBps === null ? 'Enter a match percentage between 0.01% and 100%.' : null;

  const depositInvalid = amountError ?? ratioError;

  const handleDeposit = async () => {
    if (!address || depositInvalid || amount === null || ratioBps === null) return;
    setLastAction('deposit');
    const result = await run(
      (on) =>
        aidline.depositSponsorPool(
          {
            sponsor: address,
            campaignId: campaign.id,
            ratioBps,
            cap: amount,
            amount,
          },
          sign,
          on,
        ),
      async () => (await getSponsorPool(campaign.id, address)) !== null,
    );
    if (result) {
      const updated = await getSponsorPool(campaign.id, address).catch(() => null);
      if (updated) setPool(updated);
      await refreshBalance();
    }
  };

  const handleReturn = async () => {
    if (!address || !canReturn) return;
    setLastAction('return');
    const result = await run(
      (on) => aidline.returnSponsorPool(address, campaign.id, sign, on),
      async () => (await getSponsorPool(campaign.id, address)) === null,
    );
    if (result) {
      setPool(null);
      await refreshBalance();
    }
  };

  if (!pool && !canDeposit) return null;

  return (
    <div className="space-y-5">
      {pool && (
        <div>
          <SponsorPool pool={pool} />
          {canReturn && (
            <div className="mt-4">
              <button
                type="button"
                className="btn btn-secondary w-full"
                disabled={busy}
                onClick={() => void handleReturn()}
              >
                Return unused matching funds ({formatAmount(pool.remaining)})
              </button>
              {lastAction === 'return' && (
                <TxStatus
                  state={state}
                  success="Unused matching funds were returned to your wallet."
                />
              )}
            </div>
          )}
        </div>
      )}

      {canDeposit && (
        <section className="border-t border-rule pt-5">
          <p className="kicker">Sponsor matching</p>
          <p className="mt-2 text-[0.9375rem] text-ink-soft">
            Commit funds up front to match incoming donations up to your pool cap.
          </p>

          <form
            noValidate
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleDeposit();
            }}
          >
            <div>
              <label className="label" htmlFor="sponsor-amount">
                Pool amount and cap
              </label>
              <div className="flex">
                <input
                  id="sponsor-amount"
                  inputMode="decimal"
                  className="field figure rounded-r-none"
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    if (state.phase === 'done' || state.phase === 'error') reset();
                  }}
                />
                <span className="figure flex items-center border border-l-0 border-rule bg-paper-sunk px-3 text-ink-muted">
                  {config.tokenSymbol}
                </span>
              </div>
              <p className="hint">Deposited up front as the maximum total match.</p>
              {amountError && (
                <p className="mt-1.5 text-[0.8125rem] text-danger">{amountError}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="sponsor-ratio">
                Match rate
              </label>
              <div className="mb-2 flex gap-2">
                {RATIO_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setRatioInput(preset);
                      if (state.phase === 'done' || state.phase === 'error') reset();
                    }}
                    className={`figure flex-1 border py-1.5 text-sm transition-colors ${
                      ratioInput === preset
                        ? 'border-ink bg-ink text-paper'
                        : 'border-rule text-ink hover:border-ink'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
              <div className="flex">
                <input
                  id="sponsor-ratio"
                  inputMode="decimal"
                  className="field figure rounded-r-none"
                  value={ratioInput}
                  onChange={(e) => {
                    setRatioInput(e.target.value);
                    if (state.phase === 'done' || state.phase === 'error') reset();
                  }}
                />
                <span className="figure flex items-center border border-l-0 border-rule bg-paper-sunk px-3 text-ink-muted">
                  %
                </span>
              </div>
              <p className="hint">Percentage of each donation matched (0.01% to 100%).</p>
              {ratioError && (
                <p className="mt-1.5 text-[0.8125rem] text-danger">{ratioError}</p>
              )}
            </div>

            {wallet.status === 'connected' ? (
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={busy || depositInvalid !== null}
              >
                Fund matching pool{amount !== null && amount > 0n ? ` (${formatAmount(amount)})` : ''}
              </button>
            ) : (
              <button type="button" className="btn btn-primary w-full" onClick={() => void connect()}>
                Connect wallet to sponsor
              </button>
            )}
          </form>

          {lastAction === 'deposit' && (
            <TxStatus state={state} success="Matching pool funded." />
          )}
        </section>
      )}
    </div>
  );
}
