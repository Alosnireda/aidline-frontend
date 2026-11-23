'use client';

import { useState } from 'react';

import type { Campaign } from '@/lib/api';

import { TypographicCover } from './TypographicCover';

export function CampaignCover({
  campaign,
  className = '',
  loading = 'lazy',
}: {
  campaign: Pick<Campaign, 'kind' | 'metadata'>;
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  const m = campaign.metadata;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (m?.imageUrl && failedUrl !== m.imageUrl) {
    return (
      // Campaign images come from arbitrary hosts, so next/image optimisation is not used.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={m.imageUrl}
        alt=""
        loading={loading}
        onError={() => setFailedUrl(m.imageUrl)}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <TypographicCover
      kind={campaign.kind}
      location={m?.location ?? 'Location pending'}
      className={className}
    />
  );
}
