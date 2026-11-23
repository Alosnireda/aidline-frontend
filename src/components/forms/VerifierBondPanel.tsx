'use client';

import { useCallback, useEffect, useState } from 'react';

import { TxStatus } from '@/components/ui/TxStatus';
import { useWallet } from '@/components/wallet/WalletProvider';
import { config } from '@/lib/config';
import { amountInput, formatAmount, formatDate, parseAmount } from '@/lib/format';
import {
  getBondRequirement,
  getBondWithdrawDelay,
  getVerifierBond,
  type VerifierBond,
} from '@/lib/stellar/balance';
import { aidline } from '@/lib/stellar/tx';
import { useTx } from '@/lib/useTx';

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && days === 0) parts.push(`${secs}s`);
  return parts.join(' ') || '0s';
}

export function VerifierBondPanel({
  initialRequirement,
  initialWithdrawDelay,
}: {
  initialRequirement: string;
  initialWithdrawDelay: number;
}) {
  const { address, state: wallet, balance, connect, sign, refreshBalance } = useWallet();
  const { state, run, busy } = useTx();

  const [requirement, setRequirement] = useState<bigint>(() => BigInt(initialRequirement));
  const [withdrawDelay, setWithdrawDelay] = useState<number>(initialWithdrawDelay);
  const [bond, setBond] = useState<VerifierBond | null>(null);
  const [loadingBond, setLoadingBond] = useState(false);
  const [input, setInput] = useState(() =>
    BigInt(initialRequirement) > 0n ? amountInput(BigInt(initialRequirement)) : '',
  );
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [lastAction, setLastAction] = useState<'register' | 'deregister' | 'withdraw' | null>(null);

  const loadState = useCallback(async () => {
    setLoadingBond(true);
    try {
      const [req, delay, b] = await Promise.all([
        getBondRequirement().catch(() => requirement),
        getBondWithdrawDelay().catch(() => withdrawDelay),
        address ? getVerifierBond(address).catch(() => null) : Promise.resolve(null),
      ]);
      setRequirement(req);
      setWithdrawDelay(delay);
      setBond(b);
      if (req > 0n && !input) {
        setInput(amountInput(req));
      }
    } finally {
      setLoadingBond(false);
    }
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    if (bond?.status !== 'PendingWithdrawal') return;
    const id = setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [bond?.status]);

  const hasManagedBond = bond && (bond.status === 'Active' || bond.status === 'PendingWithdrawal');
  if (requirement <= 0n && !hasManagedBond) {
    return null;
  }

  const parsedAmount = parseAmount(input);
  const invalid =
    parsedAmount === null
      ? 'Enter a valid bond amount.'
      : parsedAmount <= 0n
        ? 'Bond amount must be greater than zero.'
        : parsedAmount < requirement
          ? `Bond must be at least ${formatAmount(requirement)}.`
          : balance !== null && parsedAmount > balance
            ? `Your wallet holds ${formatAmount(balance)}.`
            : null;

  const remainingWaitSeconds =
    bond?.status === 'PendingWithdrawal'
      ? Math.max(0, bond.deregisteredAt + withdrawDelay - nowSeconds)
      : 0;

  const handleRegister = async () => {
    if (!address || parsedAmount === null || invalid) return;
    setLastAction('register');
    const res = await run((on) => aidline.registerWithBond(address, parsedAmount, sign, on));
    if (res) {
      await loadState();
      refreshBalance();
    }
  };

  const handleDeregister = async () => {
    if (!address) return;
    setLastAction('deregister');
    const res = await run((on) => aidline.deregisterVerifier(address, address, sign, on));
    if (res) {
      await loadState();
    }
  };

  const handleWithdraw = async () => {
    if (!address) return;
    setLastAction('withdraw');
    const res = await run((on) => aidline.withdrawBond(address, sign, on));
    if (res) {
      await loadState();
      refreshBalance();
    }
  };

  const successMessage =
    lastAction === 'register'
      ? 'Bond posted. Your wallet is now registered as a verifier.'
      : lastAction === 'deregister'
        ? 'Verifier deregistered. Your bond withdrawal countdown has started.'
        : 'Your verifier bond has been withdrawn to your wallet.';

  return (
    <div className="space-y-6">
      {requirement > 0n && (
        <div className="border-y border-rule py-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-ink-muted">Required verifier bond</span>
            <span className="figure font-medium text-ink">{formatAmount(requirement)}</span>
          </div>
          {withdrawDelay > 0 && (
            <div className="mt-2 flex justify-between gap-4">
              <span className="text-ink-muted">Withdrawal wait after deregistering</span>
              <span className="figure text-ink">{formatDuration(withdrawDelay)}</span>
            </div>
          )}
        </div>
      )}

      {wallet.status !== 'connected' || !address ? (
        <div className="border-y border-rule py-6">
          <p className="text-[0.9375rem]">
            Connect your wallet to register immediately with a bond or manage an existing bond.
          </p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => void connect()}>
            Connect wallet
          </button>
        </div>
      ) : loadingBond && !bond ? (
        <p className="text-sm text-ink-muted">Checking your verifier bond status…</p>
      ) : bond?.status === 'Active' ? (
        <div className="space-y-4 border-l-2 border-ink pl-4">
          <div>
            <p className="font-medium text-ink">Active verifier bond</p>
            <p className="mt-1 text-sm text-ink-soft">
              You have <span className="figure text-ink">{formatAmount(bond.remaining)}</span>{' '}
              bonded on chain (originally {formatAmount(bond.amount)}).
            </p>
          </div>
          <p className="text-sm text-ink-muted">
            To stop verifying and reclaim your bond, deregister first.
            {withdrawDelay > 0
              ? ` You can withdraw ${formatDuration(withdrawDelay)} after deregistering.`
              : ' You can withdraw immediately after deregistering.'}
          </p>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => void handleDeregister()}
          >
            Deregister verifier
          </button>
        </div>
      ) : bond?.status === 'PendingWithdrawal' ? (
        <div className="space-y-4 border-l-2 border-ink pl-4">
          <div>
            <p className="font-medium text-ink">Bond pending withdrawal</p>
            <p className="mt-1 text-sm text-ink-soft">
              Remaining bond: <span className="figure text-ink">{formatAmount(bond.remaining)}</span>
              {bond.deregisteredAt > 0 && (
                <> · Deregistered {formatDate(new Date(bond.deregisteredAt * 1000))}</>
              )}
            </p>
          </div>
          {remainingWaitSeconds > 0 ? (
            <p className="text-sm text-ink-muted">
              Remaining wait before withdrawal:{' '}
              <span className="figure font-medium text-ink">
                {formatDuration(remainingWaitSeconds)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-ink-soft">
              The withdrawal waiting period has passed. You can withdraw your bond now.
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || remainingWaitSeconds > 0 || bond.remaining <= 0n}
            onClick={() => void handleWithdraw()}
          >
            {remainingWaitSeconds > 0
              ? `Withdraw in ${formatDuration(remainingWaitSeconds)}`
              : `Withdraw ${formatAmount(bond.remaining)}`}
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleRegister();
          }}
        >
          {bond?.status === 'Withdrawn' && (
            <p className="text-sm text-ink-muted">
              Your previous bond has been withdrawn. You can post a new bond below to re-register.
            </p>
          )}
          {bond?.status === 'Slashed' && (
            <p className="text-sm text-danger">
              Your previous bond was slashed. You can post a new bond below if eligible.
            </p>
          )}
          <div>
            <label htmlFor="bond-amount" className="label">
              Bond amount ({config.tokenSymbol})
            </label>
            <div className="flex">
              <input
                id="bond-amount"
                inputMode="decimal"
                autoComplete="off"
                className="field figure rounded-r-none text-lg"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-invalid={Boolean(invalid && input)}
                aria-describedby="bond-amount-hint"
                disabled={busy}
              />
              <span className="figure flex items-center border border-l-0 border-rule bg-paper-sunk px-3 text-ink-muted">
                {config.tokenSymbol}
              </span>
            </div>
            <p id="bond-amount-hint" className={`hint ${invalid && input ? 'text-danger' : ''}`}>
              {invalid && input
                ? invalid
                : `Posts at least ${formatAmount(requirement)} into escrow and registers your wallet immediately.`}
            </p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy || Boolean(invalid)}>
            {parsedAmount && !invalid
              ? `Register with a bond (${formatAmount(parsedAmount)})`
              : 'Register with a bond'}
          </button>
        </form>
      )}

      <TxStatus state={state} success={successMessage} />
    </div>
  );
}
