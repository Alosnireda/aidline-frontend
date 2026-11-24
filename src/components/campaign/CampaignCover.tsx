'use client';

import { useState } from 'react';

import type { Campaign } from '@/lib/api';

import { KIND } from './kind';
import { TypographicCover } from './TypographicCover';

export function CampaignCover({
  campaign,
  className = '',
  alt,
  loading = 'lazy',
}: {
  campaign: Pick<Campaign, 'kind' | 'metadata'>;
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
}) {
  const m = campaign.metadata;
  const location = m?.location ?? 'Location pending';
  const coverAlt = alt ?? `${KIND[campaign.kind].label} in ${location}`;
  const imageUrl = m?.imageUrl ?? null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (imageUrl && failedUrl !== imageUrl) {
    return (
      // Campaign images come from arbitrary hosts, so next/image optimisation is not used.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={coverAlt}
        loading={loading}
        onError={() => setFailedUrl(imageUrl)}
        className={`object-cover ${className}`}
      />
    );
  }

  return <TypographicCover kind={campaign.kind} location={location} className={className} />;
}
