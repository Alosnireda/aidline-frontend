import { describe, expect, it, vi } from 'vitest';

import { ApiError, type DonorHistory } from '@/lib/api';
import {
  BACKED_CACHE_MS,
  backedCampaignIds,
  clearBackedCache,
  loadBackedCampaigns,
} from '@/lib/backed';

function history(...campaignIds: string[]): DonorHistory {
  return {
    address: 'GDONOR',
    totalDonated: '0',
    campaignsSupported: new Set(campaignIds).size,
    donations: campaignIds.map((campaignId, i) => ({
      donor: 'GDONOR',
      amount: '100',
      txHash: `hash${i}`,
      createdAt: '2026-10-01T00:00:00Z',
      campaignId,
      campaignTitle: null,
      kind: 'emergency' as const,
      goal: '1000',
      raised: '100',
      released: '0',
    })),
    refunds: [],
  };
}

describe('backedCampaignIds', () => {
  it('collects the campaigns the wallet donated to', () => {
    expect([...backedCampaignIds(history('1', '4', '9'))].sort()).toEqual(['1', '4', '9']);
  });

  it('lists a campaign once however many times it was donated to', () => {
    expect([...backedCampaignIds(history('7', '7', '7'))]).toEqual(['7']);
  });

  it('is empty for a wallet that has not donated', () => {
    expect(backedCampaignIds(history()).size).toBe(0);
  });

  it('keeps a campaign marked even after a refund, because the wallet did back it', () => {
    const h = history('3');
    h.refunds = [{ campaignId: '3', amount: '100', txHash: 'r', createdAt: '2026-10-02T00:00:00Z' }];
    expect(backedCampaignIds(h).has('3')).toBe(true);
  });
});

describe('loadBackedCampaigns', () => {
  it('shares one request between every card asking for the same wallet', async () => {
    clearBackedCache();
    const fetchHistory = vi.fn(async () => history('1', '2'));

    const [a, b] = await Promise.all([
      loadBackedCampaigns('GA', fetchHistory),
      loadBackedCampaigns('GA', fetchHistory),
    ]);

    expect(fetchHistory).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(a.has('2')).toBe(true);
  });

  it('keeps wallets apart', async () => {
    clearBackedCache();
    const fetchHistory = vi.fn(async (address: string) =>
      address === 'GA' ? history('1') : history('2'),
    );

    expect((await loadBackedCampaigns('GA', fetchHistory)).has('1')).toBe(true);
    expect((await loadBackedCampaigns('GB', fetchHistory)).has('1')).toBe(false);
    expect(fetchHistory).toHaveBeenCalledTimes(2);
  });

  it('reuses the answer for 30 seconds and then asks again', async () => {
    clearBackedCache();
    const fetchHistory = vi.fn(async () => history('1'));
    let clock = 1_000;
    const now = () => clock;

    await loadBackedCampaigns('GA', fetchHistory, now);
    clock += BACKED_CACHE_MS - 1;
    await loadBackedCampaigns('GA', fetchHistory, now);
    expect(fetchHistory).toHaveBeenCalledTimes(1);

    clock += 1;
    await loadBackedCampaigns('GA', fetchHistory, now);
    expect(fetchHistory).toHaveBeenCalledTimes(2);
  });

  it('treats a wallet the API has never seen as having backed nothing, and remembers that', async () => {
    clearBackedCache();
    const fetchHistory = vi.fn(async () => {
      throw new ApiError(404, 'Not found');
    });

    expect((await loadBackedCampaigns('GNEW', fetchHistory)).size).toBe(0);
    expect((await loadBackedCampaigns('GNEW', fetchHistory)).size).toBe(0);
    expect(fetchHistory).toHaveBeenCalledTimes(1);
  });

  it('throws on any other failure and does not remember it', async () => {
    clearBackedCache();
    const fetchHistory = vi
      .fn<(address: string) => Promise<DonorHistory>>()
      .mockRejectedValueOnce(new ApiError(500, 'Down'))
      .mockResolvedValueOnce(history('5'));

    await expect(loadBackedCampaigns('GA', fetchHistory)).rejects.toThrow('Down');
    expect((await loadBackedCampaigns('GA', fetchHistory)).has('5')).toBe(true);
    expect(fetchHistory).toHaveBeenCalledTimes(2);
  });

  it('forgets one wallet or all of them on request', async () => {
    clearBackedCache();
    const fetchHistory = vi.fn(async () => history('1'));

    await loadBackedCampaigns('GA', fetchHistory);
    await loadBackedCampaigns('GB', fetchHistory);
    clearBackedCache('GA');
    await loadBackedCampaigns('GA', fetchHistory);
    await loadBackedCampaigns('GB', fetchHistory);
    expect(fetchHistory).toHaveBeenCalledTimes(3);

    clearBackedCache();
    await loadBackedCampaigns('GB', fetchHistory);
    expect(fetchHistory).toHaveBeenCalledTimes(4);
  });
});
