'use client';

import { T } from '@/components/i18n/T';
import { useBackedCampaigns } from '@/lib/useBackedCampaigns';

/**
 * Marks a campaign the connected wallet has donated to. It is written out, not just coloured,
 * and it renders nothing when no wallet is connected or the history is not known.
 */
export function BackedMark({ campaignId }: { campaignId: string }) {
  const backed = useBackedCampaigns();
  if (!backed?.has(campaignId)) return null;

  return (
    <p className="figure mt-3 self-start border border-ink px-2 py-0.5 text-[0.6875rem] uppercase tracking-[0.08em] text-ink">
      <T k="backed.mark" />
    </p>
  );
}
