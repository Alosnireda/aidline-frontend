import { api, ApiError, type DonorHistory } from './api';

/** Ids of the campaigns `history` shows at least one donation to. */
export function backedCampaignIds(history: DonorHistory): Set<string> {
  return new Set(history.donations.map((donation) => donation.campaignId));
}

/** How long one wallet's history is reused. A page of cards asks once, not once per card. */
export const BACKED_CACHE_MS = 30_000;

interface Entry {
  at: number;
  ids: Promise<Set<string>>;
}

const cache = new Map<string, Entry>();

/**
 * The campaigns `address` has donated to. Every card on a page shares one request, and the
 * answer is reused for 30 seconds. A wallet the API has never seen has backed nothing, which is
 * an answer and not an error. Any other failure is thrown and is not remembered, so the next
 * call tries again.
 */
export function loadBackedCampaigns(
  address: string,
  fetchHistory: (address: string) => Promise<DonorHistory> = api.donor,
  now: () => number = Date.now,
): Promise<Set<string>> {
  const hit = cache.get(address);
  if (hit && now() - hit.at < BACKED_CACHE_MS) return hit.ids;

  const ids = fetchHistory(address)
    .then(backedCampaignIds)
    .catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 404) return new Set<string>();
      cache.delete(address);
      throw err;
    });
  cache.set(address, { at: now(), ids });
  return ids;
}

/** Forgets what was loaded, for one wallet or for all of them, so a new donation shows at once. */
export function clearBackedCache(address?: string): void {
  if (address) cache.delete(address);
  else cache.clear();
}
