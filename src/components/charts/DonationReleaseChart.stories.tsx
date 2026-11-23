import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { StatsHistoryPoint } from '@/lib/api';

import { DonationReleaseChart } from './DonationReleaseChart';

const DAY = 86_400_000;
const LAST_DAY = Date.UTC(2026, 10, 23);

/** Daily snapshots ending 23 Nov 2026. Amounts are stroop strings. */
function snapshots(
  count: number,
  donatedPerDay: number,
  releasedEvery: number,
): StatsHistoryPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const releases = Math.floor(i / releasedEvery);
    return {
      snapshotDate: new Date(LAST_DAY - (count - 1 - i) * DAY).toISOString().slice(0, 10),
      campaigns: 12,
      activeCampaigns: 8,
      totalDonated: String(donatedPerDay * (i + 1)),
      totalReleased: String(releases * releasedEvery * 2_000_000),
      totalRefunded: '0',
      donors: 40 + i * 3,
      verifiers: 4,
      milestonesVerified: releases,
    };
  });
}

const meta: Meta<typeof DonationReleaseChart> = {
  title: 'Charts/DonationReleaseChart',
  component: DonationReleaseChart,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DonationReleaseChart>;

export const SevenDays: Story = {
  args: { history: snapshots(7, 4_500_000_000, 2) },
};

export const ThirtyDays: Story = {
  args: { history: snapshots(30, 1_200_000_000, 5) },
};

export const NinetyDays: Story = {
  args: { history: snapshots(90, 400_000_000, 10) },
};

/** Testnet-sized totals: the whole chart is smaller than one XLM. */
export const FractionalAmounts: Story = {
  args: { history: snapshots(14, 2_500_000, 4) },
};
