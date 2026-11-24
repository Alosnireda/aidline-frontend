'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { DeadlineLabel } from '@/components/campaign/DeadlineLabel';
import { KIND } from '@/components/campaign/kind';
import { useI18n } from '@/components/i18n/I18nProvider';
import { Notice } from '@/components/ui/Notice';
import { useWallet } from '@/components/wallet/WalletProvider';
import { formatAmount } from '@/lib/format';
import { fetchActiveCampaigns, verifierQueue, type QueueItem } from '@/lib/verifierQueue';

interface Loaded {
  key: string;
  /** Null when the campaigns could not be read. */
  items: QueueItem[] | null;
}

/** The campaigns the connected wallet verifies, each with the milestone to review next. */
export function VerifierQueue() {
  const { state, connect } = useWallet();
  const { t, tn } = useI18n();
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const address = state.status === 'connected' ? state.address : null;
  const key = address ? `${address}:${attempt}` : null;

  useEffect(() => {
    if (!address || !key) return;
    let cancelled = false;
    fetchActiveCampaigns()
      .then((campaigns) => verifierQueue(address, campaigns))
      .catch(() => null)
      .then((items) => {
        if (!cancelled) setLoaded({ key, items });
      });
    return () => {
      cancelled = true;
    };
  }, [address, key]);

  if (state.status === 'loading') {
    return <p className="text-ink-muted">{t('verify.loading')}</p>;
  }

  if (!address) {
    return (
      <div className="border-y border-rule py-8">
        <p className="font-medium text-ink">{t('verify.connect.title')}</p>
        <p className="mt-1 max-w-xl text-[0.9375rem]">{t('verify.connect.body')}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => void connect()}>
          {t('wallet.connect')}
        </button>
      </div>
    );
  }

  if (!loaded || loaded.key !== key) {
    return (
      <p role="status" className="text-ink-muted">
        {t('verify.loading')}
      </p>
    );
  }

  if (!loaded.items) {
    return (
      <div>
        <Notice title={t('verify.error.title')} tone="danger">
          {t('verify.error.body')}
        </Notice>
        <button
          type="button"
          className="btn btn-secondary mt-4"
          onClick={() => setAttempt((n) => n + 1)}
        >
          {t('verify.error.retry')}
        </button>
      </div>
    );
  }

  if (loaded.items.length === 0) {
    return (
      <div className="border-y border-rule py-8">
        <p className="font-medium text-ink">{t('verify.empty.title')}</p>
        <p className="mt-1 max-w-xl text-[0.9375rem]">{t('verify.empty.body')}</p>
        <Link href="/verifiers#apply" className="link mt-3 inline-block text-[0.9375rem]">
          {t('verify.empty.apply')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="kicker" role="status">
        {tn('verify.count', loaded.items.length)}
      </p>
      <ul className="mt-4 border-t border-rule">
        {loaded.items.map((item) => {
          const { campaign } = item;
          const kind = KIND[campaign.kind];
          const title =
            campaign.metadata?.title ?? t('campaign.fallbackTitle', { id: campaign.id });
          return (
            <li
              key={campaign.id}
              className="grid gap-4 border-b border-rule py-6 md:grid-cols-[2fr_2fr_auto] md:items-center md:gap-8"
            >
              <div>
                <p className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em]">
                  <span className={kind.text}>{kind.short}</span>
                  <span className="text-rule">/</span>
                  <span className="text-ink-muted">
                    {campaign.metadata?.location ?? t('card.unknownLocation')}
                  </span>
                </p>
                <h2 className="mt-2 text-[1.375rem]">{title}</h2>
                <p className="mt-1 text-[0.8125rem] text-ink-muted">
                  <DeadlineLabel deadline={campaign.deadline} />
                </p>
              </div>
              <div className="text-[0.9375rem]">
                <p className="figure text-ink">
                  {t('verify.next', {
                    number: item.milestoneNumber,
                    total: item.milestoneTotal,
                    amount: formatAmount(item.amount),
                  })}
                </p>
                <p className="mt-1 text-ink-muted">
                  {item.funded ? t('verify.funded') : t('verify.unfunded')}
                </p>
              </div>
              <Link href={`/campaigns/${campaign.id}`} className="btn btn-secondary">
                {t('verify.review')}
                <span className="sr-only"> · {title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
