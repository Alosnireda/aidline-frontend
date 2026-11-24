import { api, type Campaign } from './api';

/** One active campaign waiting on a verifier, with the milestone that is next in line. */
export interface QueueItem {
  campaign: Campaign;
  /** 1-based position of the next milestone to release. */
  milestoneNumber: number;
  milestoneTotal: number;
  /** Amount of the next milestone, in the smallest unit. */
  amount: string;
  /** Whether enough is held in escrow to release it now. */
  funded: boolean;
}

function byQueueOrder(a: QueueItem, b: QueueItem): number {
  // Milestones that can be released now come first, then the soonest deadline.
  if (a.funded !== b.funded) return a.funded ? -1 : 1;
  const deadlines = new Date(a.campaign.deadline).getTime() - new Date(b.campaign.deadline).getTime();
  if (Number.isFinite(deadlines) && deadlines !== 0) return deadlines;
  return a.campaign.id.localeCompare(b.campaign.id, 'en', { numeric: true });
}

/**
 * The active campaigns whose verifier is `address`, each with its next milestone to review.
 * Campaigns that are not active, that name someone else, or whose milestones are all released
 * are left out.
 */
export function verifierQueue(address: string, campaigns: readonly Campaign[]): QueueItem[] {
  const queue: QueueItem[] = [];
  for (const campaign of campaigns) {
    if (campaign.status !== 'active' || campaign.verifier !== address) continue;
    const amount = campaign.milestones[campaign.milestonesReleased];
    if (amount === undefined) continue;
    const escrow = BigInt(campaign.raised) - BigInt(campaign.released);
    queue.push({
      campaign,
      milestoneNumber: campaign.milestonesReleased + 1,
      milestoneTotal: campaign.milestones.length,
      amount,
      funded: escrow >= BigInt(amount),
    });
  }
  return queue.sort(byQueueOrder);
}

const PAGE_SIZE = 100;
const MAX_CAMPAIGNS = 1000;

/** Every active campaign, read a page at a time. The API cannot filter by verifier. */
export async function fetchActiveCampaigns(
  list: typeof api.campaigns = api.campaigns,
): Promise<Campaign[]> {
  const campaigns: Campaign[] = [];
  for (let offset = 0; offset < MAX_CAMPAIGNS; ) {
    const page = await list({ status: 'active', limit: PAGE_SIZE, offset });
    campaigns.push(...page.items);
    offset += page.items.length;
    if (page.items.length < PAGE_SIZE || offset >= page.total) break;
  }
  return campaigns;
}
