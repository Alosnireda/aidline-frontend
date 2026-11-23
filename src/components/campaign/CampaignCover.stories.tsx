import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { Campaign } from '@/lib/api';

import { CampaignCover } from './CampaignCover';

const sampleCampaignWithPhoto: Pick<Campaign, 'kind' | 'metadata'> = {
  kind: 'emergency',
  metadata: {
    title: 'Hurricane Flood Relief Supplies',
    summary: 'Emergency supplies delivered to affected families.',
    location: 'Les Cayes, Haiti',
    organizer: 'Haiti Diaspora Coalition',
    category: 'Emergency Relief',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
  },
};

const sampleCampaignBrokenPhoto: Pick<Campaign, 'kind' | 'metadata'> = {
  kind: 'emergency',
  metadata: {
    title: 'Hurricane Flood Relief Supplies',
    summary: 'Emergency supplies delivered to affected families.',
    location: 'Les Cayes, Haiti',
    organizer: 'Haiti Diaspora Coalition',
    category: 'Emergency Relief',
    imageUrl: 'https://example.invalid/broken-image-url.jpg',
  },
};

const sampleCampaignNoPhoto: Pick<Campaign, 'kind' | 'metadata'> = {
  kind: 'climate',
  metadata: {
    title: 'Coastal Mangrove Reforestation',
    summary: 'Restoring coastal mangroves.',
    location: 'Saint-Louis du Sud, Haiti',
    organizer: 'EcoRelief Alliance',
    category: 'Climate Resilience',
    imageUrl: null,
  },
};

const meta: Meta<typeof CampaignCover> = {
  title: 'Campaign/CampaignCover',
  component: CampaignCover,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CampaignCover>;

export const WithPhoto: Story = {
  args: {
    campaign: sampleCampaignWithPhoto,
    className: 'aspect-video w-full max-w-lg',
  },
};

export const BrokenPhotoFallback: Story = {
  args: {
    campaign: sampleCampaignBrokenPhoto,
    className: 'aspect-video w-full max-w-lg',
  },
};

export const NoPhoto: Story = {
  args: {
    campaign: sampleCampaignNoPhoto,
    className: 'aspect-video w-full max-w-lg',
  },
};
