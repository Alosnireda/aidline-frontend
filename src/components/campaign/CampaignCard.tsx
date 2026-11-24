import Link from 'next/link';
import { T, TPlural } from '@/components/i18n/T';
import type { MessageKey } from '@/i18n';
import type { Campaign, CampaignStatus } from '@/lib/api';
import { BackedMark } from './BackedMark';
import { CampaignCover } from './CampaignCover';
import { DeadlineLabel } from './DeadlineLabel';
import { FundingBar } from './FundingBar';
import { KIND } from './kind';

const STATUS_KEY: Record<CampaignStatus, MessageKey> = {
  active: 'status.active',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
  expired: 'status.expired',
};

// #143: threshold for "Ending soon" marker — 3 days in milliseconds
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function isEndingSoon(deadline: string): boolean {
  const remaining = Number(deadline) - Date.now();
  return Number.isFinite(remaining) && remaining > 0 && remaining < THREE_DAYS_MS;
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const k = KIND[campaign.kind];
  const m = campaign.metadata;
  const endingSoon = campaign.status === 'active' && isEndingSoon(campaign.deadline);
  return (
    <article className="group relative flex flex-col border-t-2 border-ink pt-4">
      <Link
        href={`/campaigns/${campaign.id}`}
        aria-label={m?.title ?? `Campaign #${campaign.id}`}
        className="absolute inset-0 z-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        <span className="sr-only">
          {m?.title ?? <T k="campaign.fallbackTitle" vars={{ id: campaign.id }} />}
        </span>
      </Link>
      <CampaignCover campaign={campaign} className="aspect-[3/2] w-full" loading="lazy" />
      <BackedMark campaignId={campaign.id} />
      <div className="mt-4 flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em]">
        <span className={k.text}>{k.short}</span>
        <span className="text-rule">/</span>
        <span className="text-ink-muted">{m?.location ?? <T k="card.unknownLocation" />}</span>
      </div>
      <h3 className="mt-2 text-[1.375rem] group-hover:underline group-hover:decoration-rule group-hover:underline-offset-4 group-focus-within:underline group-focus-within:decoration-rule group-focus-within:underline-offset-4">
        {m?.title ?? <T k="campaign.fallbackTitle" vars={{ id: campaign.id }} />}
      </h3>
      {/* #143: Ending soon marker with text, not colour alone */}
      {endingSoon && (
        <p className="mt-1 text-[0.75rem] font-semibold uppercase tracking-wide text-danger">
          <T k="card.endingSoon" />
        </p>
      )}
      {m?.organizer && (
        <p className="mt-1.5 text-[0.8125rem] text-ink-muted">
          <T k="card.raisedBy" vars={{ name: m.organizer }} />
        </p>
      )}
      {m?.summary && <p className="mt-2 line-clamp-2 text-[0.9375rem]">{m.summary}</p>}
      <div className="mt-auto pt-5">
        <FundingBar
          kind={campaign.kind}
          goal={campaign.goal}
          raised={campaign.raised}
          released={campaign.released}
          refunded={campaign.refunded}
        />
        <p className="mt-3 flex justify-between text-[0.8125rem] text-ink-muted">
          <span>
            <T
              k="card.milestones"
              vars={{ released: campaign.milestonesReleased, total: campaign.milestones.length }}
            />
          </span>
          {/* #144: Show donor count with correct singular/plural */}
          <span>
            <TPlural base="card.donors" count={campaign.donorCount ?? 0} />
          </span>
        </p>
        <p className="mt-1 flex justify-end text-[0.8125rem] text-ink-muted">
          <span>
            {campaign.status === 'active' ? (
              <DeadlineLabel deadline={campaign.deadline} />
            ) : (
              <T k={STATUS_KEY[campaign.status]} />
            )}
          </span>
        </p>
      </div>
    </article>
  );
}
