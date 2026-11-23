import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SponsorPool } from './SponsorPool';

const meta: Meta<typeof SponsorPool> = {
  title: 'Campaign/SponsorPool',
  component: SponsorPool,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SponsorPool>;

export const WithPool: Story = {
  args: {
    pool: {
      sponsor: 'GSPONSOR1234567890ABCDEF1234567890ABCDEF1234567890ABCD',
      campaignId: '1',
      ratioBps: 10000,
      cap: 5000000000n,
      deposited: 5000000000n,
      remaining: 3250000000n,
      matched: 1750000000n,
    },
  },
};

export const PartialMatchPool: Story = {
  args: {
    pool: {
      sponsor: 'GSPONSOR1234567890ABCDEF1234567890ABCDEF1234567890ABCD',
      campaignId: '1',
      ratioBps: 5000,
      cap: 2000000000n,
      deposited: 2000000000n,
      remaining: 1500000000n,
      matched: 500000000n,
    },
  },
};

export const WithoutPool: Story = {
  args: {
    pool: null,
  },
};
