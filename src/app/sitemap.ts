import type { MetadataRoute } from 'next';

import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { safe } from '@/lib/safe';

// Regenerate hourly so new campaigns are picked up without a redeploy.
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/campaigns', priority: 0.9 },
  { path: '/how-it-works', priority: 0.7 },
  { path: '/verifiers', priority: 0.6 },
  { path: '/start', priority: 0.5 },
];

const PAGE_SIZE = 100;
const MAX_CAMPAIGNS = 10_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority }) => ({
    url: `${config.siteUrl}${path}`,
    changeFrequency: 'daily',
    priority,
  }));

  // If the API is unreachable, still serve the static pages.
  for (let offset = 0; offset < MAX_CAMPAIGNS; ) {
    const page = await safe(() => api.campaigns({ limit: PAGE_SIZE, offset }));
    if (!page || page.items.length === 0) break;

    for (const c of page.items) {
      pages.push({
        url: `${config.siteUrl}/campaigns/${c.id}`,
        lastModified: new Date(c.createdAt),
        changeFrequency: c.status === 'active' ? 'daily' : 'monthly',
        priority: c.status === 'active' ? 0.8 : 0.4,
      });
    }

    offset += page.items.length;
    if (page.items.length < PAGE_SIZE || offset >= page.total) break;
  }
  return pages;
}
