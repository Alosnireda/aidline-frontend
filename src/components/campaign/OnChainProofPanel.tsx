import { config, explorer } from '@/lib/config';
import { formatAmount } from '@/lib/format';

interface Props {
  apiEscrow: bigint;
  onChainEscrow: bigint | null;
}

function absoluteDifference(a: bigint, b: bigint): bigint {
  return a >= b ? a - b : b - a;
}

export function OnChainProofPanel({ apiEscrow, onChainEscrow }: Props) {
  const difference = onChainEscrow === null ? null : absoluteDifference(onChainEscrow, apiEscrow);

  return (
    <section className="border-t border-rule pt-5">
      <p className="kicker">On-chain proof</p>
      <dl className="mt-3 space-y-3 text-sm">
        <div>
          <dt className="text-ink-muted">Contract</dt>
          <dd className="mt-1 break-all">
            {config.contractId ? (
              <>
                <span className="figure text-ink">{config.contractId}</span>
                <a
                  href={explorer.contract(config.contractId)}
                  target="_blank"
                  rel="noreferrer"
                  className="link mt-1 inline-block"
                >
                  View contract on Stellar Expert
                </a>
              </>
            ) : (
              <span className="text-ink-muted">Not configured</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Escrow on contract</dt>
          <dd className="figure mt-1 text-ink">
            {onChainEscrow === null ? 'Unavailable' : formatAmount(onChainEscrow)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Indexer escrow</dt>
          <dd className="figure mt-1 text-ink">{formatAmount(apiEscrow)}</dd>
        </div>
      </dl>
      {onChainEscrow === null ? (
        <p role="status" className="mt-3 text-sm text-ink-muted">
          The contract could not be read. Try again later.
        </p>
      ) : difference === 0n ? (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          Matches the indexer.
        </p>
      ) : (
        <p role="status" className="mt-3 text-sm text-danger">
          Does not match the indexer. Difference: {formatAmount(difference)}.
        </p>
      )}
    </section>
  );
}
