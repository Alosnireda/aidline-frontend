import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';

import { DonatePanel } from '@/components/campaign/DonatePanel';
import { FundingBar } from '@/components/campaign/FundingBar';
import { KIND } from '@/components/campaign/kind';
import { Wordmark } from '@/components/layout/Wordmark';
import { api } from '@/lib/api';
import { embedDonateState } from '@/lib/embed';
import { safe } from '@/lib/safe';
import { ApiError, api, type CampaignDetail } from '@/lib/api';

interface Props {
  params: Promise<{ id: string }>;
}

// Embeds are loaded inside third-party pages; keep them out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function EmbedCampaignPage({ params }: Props) {
  const { id } = await params;
  let campaign: CampaignDetail;
  try {
    campaign = await api.campaign(id);
  } catch (err) {
    unstable_rethrow(err);
    // Only a 404 means the campaign is missing. Any other failure is an outage, and the
    // embed must not claim the campaign does not exist.
    if (err instanceof ApiError && err.status === 404) notFound();
    return <EmbedUnavailable />;
  }

  const k = KIND[campaign.kind];
  const donate = embedDonateState(campaign.status);
  const m = campaign.metadata;

  return (
    <div className="min-h-screen bg-paper p-4 font-sans text-ink antialiased">
      <div className="mx-auto max-w-sm rounded-[2px] border border-ink bg-paper-raised p-5">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <Wordmark newTab />
          <span className={`text-[0.6875rem] font-medium uppercase tracking-wider ${k.text}`}>
            {k.short}
          </span>
        </div>

        <div className="mt-3">
          <h2 className="text-lg font-bold text-ink leading-snug">
            {m?.title ?? `Campaign #${campaign.id}`}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            {m?.organizer ? `By ${m.organizer}` : (m?.location ?? 'Verified Campaign')}
          </p>
        </div>

        <div className="mt-4">
          <FundingBar
            kind={campaign.kind}
            goal={campaign.goal}
            raised={campaign.raised}
            released={campaign.released}
            refunded={campaign.refunded}
            size="sm"
          />
        </div>

        <div className="mt-5 border-t border-rule pt-4">
          {donate.canDonate ? (
            <DonatePanel campaign={campaign} />
          ) : (
            <p className="text-sm text-ink-muted">{donate.message}</p>
          )}
        </div>

        <div className="mt-4 border-t border-rule pt-3 text-center">
          <Link
            href={`/campaigns/${campaign.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link text-xs font-mono"
          >
            View full campaign on Aidline &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmbedUnavailable() {
  return (
    <div className="min-h-screen bg-paper p-4 font-sans text-ink antialiased">
      <div
        role="status"
        className="mx-auto max-w-sm rounded-[2px] border border-ink bg-paper-raised p-5 text-sm"
      >
        <p className="font-bold">Campaign temporarily unavailable</p>
        <p className="mt-2 text-ink-muted">
          We could not load this campaign right now. Please try again in a few minutes.
        </p>
      </div>
    </div>
  );
}
