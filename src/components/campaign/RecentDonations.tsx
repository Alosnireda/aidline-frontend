'use client';

import { useState } from 'react';
import Link from 'next/link';

import type { Donation } from '@/lib/api';
import { api } from '@/lib/api';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';
import { Notice } from '@/components/ui/Notice';

const PAGE_SIZE = 10;

interface RecentDonationsProps {
  campaignId: string;
  initialDonations: Donation[] | null;
  initialTotal?: number;
}

export function RecentDonations({
  campaignId,
  initialDonations,
  initialTotal,
}: RecentDonationsProps) {
  const [items, setItems] = useState<Donation[]>(() => initialDonations ?? []);
  const [total, setTotal] = useState<number>(() =>
    Math.max(initialDonations?.length ?? 0, initialTotal ?? 0),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialDonations === null ? 'Recent donations could not be loaded.' : null,
  );
  const [hasMore, setHasMore] = useState<boolean>(() => {
    if (!initialDonations) return false;
    if (initialTotal !== undefined && initialTotal > 0) {
      return initialDonations.length < initialTotal;
    }
    return initialDonations.length >= PAGE_SIZE;
  });

  const totalCount = Math.max(items.length, total);

  async function loadMore(offsetOverride?: number) {
    if (loading) return;
    const currentOffset = offsetOverride ?? items.length;
    setLoading(true);
    setError(null);
    try {
      const res = await api.donations(campaignId, PAGE_SIZE, currentOffset);
      const incoming = res.items;

      setItems((prev) => {
        if (currentOffset === 0) return incoming;
        const seen = new Set(prev.map((d) => d.txHash));
        const filtered = incoming.filter((d) => !seen.has(d.txHash));
        return [...prev, ...filtered];
      });

      if (res.total !== undefined) {
        setTotal(res.total);
        if (currentOffset + incoming.length >= res.total) {
          setHasMore(false);
        } else {
          setHasMore(incoming.length >= PAGE_SIZE);
        }
      } else if (incoming.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch {
      setError('Could not load donations. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="kicker">Recent donations</p>
        {items.length > 0 && (
          <p className="figure text-xs text-ink-muted">
            Showing {items.length} of {totalCount} donation{totalCount === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {initialDonations === null && items.length === 0 && error ? (
        <div className="mt-4">
          <Notice title="Recent donations could not be loaded" tone="danger">
            <p className="text-ink-muted">The Aidline API is not responding.</p>
            <button
              type="button"
              onClick={() => void loadMore(0)}
              disabled={loading}
              className="btn btn-secondary mt-3 text-xs"
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </Notice>
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 text-ink-muted">No donations yet. Yours could be the first.</p>
      ) : (
        <>
          <ul className="mt-4 border-t border-rule" aria-label="Recent donations">
            {items.map((d) => (
              <li
                key={d.txHash}
                className="figure flex justify-between gap-4 border-b border-rule py-3 text-sm"
              >
                <Link href={`/donors/${d.donor}`} className="link">
                  <span className="sr-only">Donor: </span>
                  {shortAddress(d.donor, 6)}
                </Link>
                <span className="text-ink-muted">
                  <span className="sr-only">Date: </span>
                  {formatDate(d.createdAt)}
                </span>
                <span className="text-ink">
                  <span className="sr-only">Amount: </span>
                  {formatAmount(d.amount)}
                </span>
              </li>
            ))}
          </ul>

          {error && (
            <div className="mt-4">
              <Notice title="Failed to load more donations" tone="danger">
                <p className="text-ink-muted">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loading}
                  className="btn btn-secondary mt-3 text-xs"
                >
                  {loading ? 'Retrying...' : 'Try again'}
                </button>
              </Notice>
            </div>
          )}

          {hasMore && !error && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loading}
                className="btn btn-secondary w-full"
              >
                {loading ? 'Loading donations...' : 'Show more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
