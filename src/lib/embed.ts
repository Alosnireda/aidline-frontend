import { STATUS_LABEL } from '@/components/campaign/kind';
import type { CampaignStatus } from '@/lib/api';

/**
 * What the embed widget shows in place of the donate form. Only an active
 * campaign takes donations; for any other status a donation would fail in the
 * contract, so the widget says what state the campaign is in instead.
 */
export type EmbedDonateState =
  | { canDonate: true }
  | { canDonate: false; message: string };

export function embedDonateState(status: CampaignStatus): EmbedDonateState {
  if (status === 'active') return { canDonate: true };
  return { canDonate: false, message: `This campaign is no longer taking donations: ${STATUS_LABEL[status].toLowerCase()}.` };
}
