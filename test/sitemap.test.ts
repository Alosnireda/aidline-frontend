import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));

import sitemap from '@/app/sitemap';
import { api, type Campaign } from '@/lib/api';

function makeCampaign(index: number): Campaign {
  return {
    id: `campaign-${index}`,
    kind: 'emergency',
    status: index % 2 === 0 ? 'active' : 'completed',
    creator: 'GCREATOR',
    beneficiary: 'GBENEFICIARY',
    verifier: 'GVERIFIER',
    goal: '10000000',
    raised: '5000000',
    released: '0',
    milestones: ['10000000'],
    milestonesReleased: 0,
    deadline: '2026-12-31T00:00:00Z',
    metadataUri: 'https://example.com/meta.json',
    createdAt: '2026-01-01T00:00:00Z',
    donorCount: 1,
    metadata: null,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sitemap', () => {
  it('pages through the API until every campaign is listed', async () => {
    const allCampaigns = Array.from({ length: 250 }, (_, i) => makeCampaign(i));
    const spy = vi.spyOn(api, 'campaigns').mockImplementation(async ({ limit = 100, offset = 0 } = {}) => ({
      items: allCampaigns.slice(offset, offset + limit),
      total: allCampaigns.length,
    }));

    const entries = await sitemap();
    const campaignUrls = entries.map((e) => e.url).filter((u) => u.includes('/campaigns/'));

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenNthCalledWith(1, { limit: 100, offset: 0 });
    expect(spy).toHaveBeenNthCalledWith(2, { limit: 100, offset: 100 });
    expect(spy).toHaveBeenNthCalledWith(3, { limit: 100, offset: 200 });
    expect(campaignUrls).toHaveLength(250);
    expect(campaignUrls[0]).toMatch(/\/campaigns\/campaign-0$/);
    expect(campaignUrls[249]).toMatch(/\/campaigns\/campaign-249$/);
  });

  it('still serves static pages if the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(api, 'campaigns').mockRejectedValue(new Error('api down'));

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(5);
    expect(entries.some((e) => e.url.endsWith('/campaigns'))).toBe(true);
  });
});
