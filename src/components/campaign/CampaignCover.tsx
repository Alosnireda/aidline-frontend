import type { Campaign } from '@/lib/api';

import { KIND } from './kind';
import { TypographicCover } from './TypographicCover';

export function CampaignCover({
  campaign,
  className = '',
  alt,
}: {
  campaign: Pick<Campaign, 'kind' | 'metadata'>;
  className?: string;
  alt?: string;
}) {
  const m = campaign.metadata;
  const location = m?.location ?? 'Location pending';
  const coverAlt = alt ?? `${KIND[campaign.kind].label} in ${location}`;

  if (m?.imageUrl) {
    return (
      // Campaign images come from arbitrary hosts, so next/image optimisation is not used.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.imageUrl} alt={coverAlt} className={`object-cover ${className}`} />
    );
  }
  return <TypographicCover kind={campaign.kind} location={location} className={className} />;
}
