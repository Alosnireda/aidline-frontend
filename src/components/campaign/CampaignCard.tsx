import Link from 'next/link';
import type { Campaign } from '@/lib/api';
import { deadlineLabel } from '@/lib/format';
import { CampaignCover } from './CampaignCover';
import { FundingBar } from './FundingBar';
import { KIND, STATUS_LABEL } from './kind';
// #143: threshold for "Ending soon" marker — 3 days in milliseconds
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const k = KIND[campaign.kind];
  const m = campaign.metadata;
  // eslint-disable-next-line react-hooks/purity -- render-time comparison for static card display
  const now = Date.now();
  const endingSoon =
    campaign.status === 'active' &&
    campaign.deadline &&
    Number(campaign.deadline) > 0 &&
    Number(campaign.deadline) - now > 0 &&
    Number(campaign.deadline) - now < THREE_DAYS_MS;
  return (
    <article className="group relative flex flex-col border-t-2 border-ink pt-4">
      <Link
        href={`/campaigns/${campaign.id}`}
        aria-label={m?.title ?? `Campaign #${campaign.id}`}
        className="absolute inset-0 z-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        <span className="sr-only">{m?.title ?? `Campaign #${campaign.id}`}</span>
      </Link>
      <CampaignCover campaign={campaign} className="aspect-[3/2] w-full" />
      <div className="mt-4 flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em]">
        <span className={k.text}>{k.short}</span>
        <span className="text-rule">/</span>
        <span className="text-ink-muted">{m?.location ?? 'Unknown location'}</span>
      </div>
      <h3 className="mt-2 text-[1.375rem] group-hover:underline group-hover:decoration-rule group-hover:underline-offset-4 group-focus-within:underline group-focus-within:decoration-rule group-focus-within:underline-offset-4">
        {m?.title ?? `Campaign #${campaign.id}`}
      </h3>
      {/* #143: Ending soon marker with text, not colour alone */}
      {endingSoon && (
        <p className="mt-1 text-[0.75rem] font-semibold uppercase tracking-wide text-danger">
          Ending soon
        </p>
      )}
      {m?.organizer && (
        <p className="mt-1.5 text-[0.8125rem] text-ink-muted">Raised by {m.organizer}</p>
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
            {campaign.milestonesReleased} of {campaign.milestones.length} milestones verified
          </span>
          {/* #144: Show donor count with correct singular/plural */}
          <span>
            {campaign.donorCount ?? 0} donor{(campaign.donorCount ?? 0) === 1 ? '' : 's'}
          </span>
        </p>
        <p className="mt-1 flex justify-end text-[0.8125rem] text-ink-muted">
          <span>
            {campaign.status === 'active'
              ? deadlineLabel(campaign.deadline)
              : STATUS_LABEL[campaign.status]}
          </span>
        </p>
      </div>
    </article>
  );
}
