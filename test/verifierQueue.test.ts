import { describe, expect, it, vi } from 'vitest';

import type { Campaign } from '@/lib/api';
import { fetchActiveCampaigns, verifierQueue } from '@/lib/verifierQueue';

const ME = 'GVERIFIER';

function campaign(overrides: Partial<Campaign> & { id: string }): Campaign {
  return {
    kind: 'emergency',
    status: 'active',
    creator: 'GCREATOR',
    beneficiary: 'GBENEFICIARY',
    verifier: ME,
    goal: '1000',
    raised: '600',
    released: '0',
    milestones: ['300', '300', '400'],
    milestonesReleased: 0,
    deadline: '2026-12-31T00:00:00Z',
    metadataUri: 'uri',
    createdAt: '2026-09-01T00:00:00Z',
    donorCount: 3,
    metadata: null,
    ...overrides,
  };
}

describe('verifierQueue', () => {
  it('lists the active campaigns that name the wallet as verifier', () => {
    const queue = verifierQueue(ME, [
      campaign({ id: '1' }),
      campaign({ id: '2', verifier: 'GSOMEONEELSE' }),
      campaign({ id: '3' }),
    ]);
    expect(queue.map((item) => item.campaign.id)).toEqual(['1', '3']);
  });

  it('leaves out campaigns that are no longer active', () => {
    const queue = verifierQueue(ME, [
      campaign({ id: '1', status: 'completed' }),
      campaign({ id: '2', status: 'cancelled' }),
      campaign({ id: '3', status: 'expired' }),
      campaign({ id: '4' }),
    ]);
    expect(queue.map((item) => item.campaign.id)).toEqual(['4']);
  });

  it('points at the next unreleased milestone, counting from one', () => {
    const [item] = verifierQueue(ME, [campaign({ id: '1', milestonesReleased: 1 })]);
    expect(item).toMatchObject({ milestoneNumber: 2, milestoneTotal: 3, amount: '300' });
  });

  it('leaves out a campaign whose milestones are all released', () => {
    expect(verifierQueue(ME, [campaign({ id: '1', milestonesReleased: 3 })])).toEqual([]);
  });

  it('says whether escrow covers the next milestone', () => {
    const [funded, unfunded] = verifierQueue(ME, [
      campaign({ id: '1', raised: '300', released: '0' }),
      campaign({ id: '2', raised: '299', released: '0' }),
    ]);
    expect(funded?.funded).toBe(true);
    expect(unfunded?.funded).toBe(false);
  });

  it('counts only what is still held in escrow, not everything ever raised', () => {
    const [item] = verifierQueue(ME, [
      campaign({ id: '1', raised: '600', released: '400', milestonesReleased: 1 }),
    ]);
    expect(item?.funded).toBe(false); // 200 held, 300 needed
  });

  it('puts milestones that can be released now first, then the soonest deadline', () => {
    const queue = verifierQueue(ME, [
      campaign({ id: 'late-funded', raised: '1000', deadline: '2026-12-31T00:00:00Z' }),
      campaign({ id: 'soon-unfunded', raised: '10', deadline: '2026-11-01T00:00:00Z' }),
      campaign({ id: 'soon-funded', raised: '1000', deadline: '2026-11-15T00:00:00Z' }),
    ]);
    expect(queue.map((item) => item.campaign.id)).toEqual([
      'soon-funded',
      'late-funded',
      'soon-unfunded',
    ]);
  });

  it('breaks ties by campaign id, numerically', () => {
    const queue = verifierQueue(ME, [campaign({ id: '10' }), campaign({ id: '9' })]);
    expect(queue.map((item) => item.campaign.id)).toEqual(['9', '10']);
  });

  it('returns nothing for a wallet that verifies no campaign', () => {
    expect(verifierQueue('GNOBODY', [campaign({ id: '1' })])).toEqual([]);
    expect(verifierQueue(ME, [])).toEqual([]);
  });

  it('does not change the list it is given', () => {
    const input = [campaign({ id: '2' }), campaign({ id: '1' })];
    verifierQueue(ME, input);
    expect(input.map((c) => c.id)).toEqual(['2', '1']);
  });
});

describe('fetchActiveCampaigns', () => {
  const items = (from: number, count: number) =>
    Array.from({ length: count }, (_, i) => campaign({ id: String(from + i) }));

  it('asks only for active campaigns', async () => {
    const list = vi.fn(async () => ({ items: items(1, 2), total: 2 }));
    await fetchActiveCampaigns(list as never);
    expect(list).toHaveBeenCalledWith({ status: 'active', limit: 100, offset: 0 });
  });

  it('reads further pages until it has them all', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items: items(1, 100), total: 230 })
      .mockResolvedValueOnce({ items: items(101, 100), total: 230 })
      .mockResolvedValueOnce({ items: items(201, 30), total: 230 });

    const all = await fetchActiveCampaigns(list as never);

    expect(all).toHaveLength(230);
    expect(list.mock.calls.map(([params]) => params.offset)).toEqual([0, 100, 200]);
  });

  it('stops on an empty page', async () => {
    const list = vi.fn(async () => ({ items: [], total: 500 }));
    expect(await fetchActiveCampaigns(list as never)).toEqual([]);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('lets an API failure through so the page can offer a retry', async () => {
    const list = vi.fn(async () => {
      throw new Error('down');
    });
    await expect(fetchActiveCampaigns(list as never)).rejects.toThrow('down');
  });
});
