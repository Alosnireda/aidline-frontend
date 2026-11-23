import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { Donation } from '@/lib/api';

import { RecentDonations } from './RecentDonations';

const sampleDonations: Donation[] = [
  {
    donor: 'GCREATOR1234567890ABCDEF1234567890ABCDEF1234567890A',
    amount: '500000000',
    txHash: '0x1234567890abcdef1',
    createdAt: '2026-11-20T14:32:00Z',
  },
  {
    donor: 'GBENEFICIARY1234567890ABCDEF1234567890ABCDEF12345678',
    amount: '250000000',
    txHash: '0x1234567890abcdef2',
    createdAt: '2026-11-19T10:15:00Z',
  },
  {
    donor: 'GVERIFIER1234567890ABCDEF1234567890ABCDEF1234567890A',
    amount: '100000000',
    txHash: '0x1234567890abcdef3',
    createdAt: '2026-11-18T18:45:00Z',
  },
];

const meta: Meta<typeof RecentDonations> = {
  title: 'Campaign/RecentDonations',
  component: RecentDonations,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RecentDonations>;

export const WithMoreDonations: Story = {
  args: {
    campaignId: '1',
    initialDonations: sampleDonations,
    initialTotal: 15,
  },
};

export const AllDonationsShown: Story = {
  args: {
    campaignId: '1',
    initialDonations: sampleDonations,
    initialTotal: 3,
  },
};

export const NoDonations: Story = {
  args: {
    campaignId: '1',
    initialDonations: [],
    initialTotal: 0,
  },
};

export const LoadFailure: Story = {
  args: {
    campaignId: '1',
    initialDonations: null,
  },
};
