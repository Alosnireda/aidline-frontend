import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { Campaign } from '@/lib/api';

import { CampaignCard } from './CampaignCard';

const sampleEmergencyCampaign: Campaign = {
  id: '1',
  kind: 'emergency',
  status: 'active',
  creator: 'GCREATOR1234567890ABCDEF1234567890ABCDEF1234567890A',
  beneficiary: 'GBENEFICIARY1234567890ABCDEF1234567890ABCDEF12345678',
  verifier: 'GVERIFIER1234567890ABCDEF1234567890ABCDEF1234567890A',
  goal: '1000000000',
  raised: '650000000',
  released: '300000000',
  milestones: ['300000000', '300000000', '400000000'],
  milestonesReleased: 1,
  deadline: '2026-12-31T23:59:59Z',
  metadataUri: 'https://api.aidline.org/metadata/1',
  createdAt: '2026-09-01T10:00:00Z',
  donorCount: 28,
  metadata: {
    title: 'Hurricane Flood Relief Supplies',
    summary:
      'Emergency food, clean water, and medical kits delivered directly to affected families.',
    description: 'Full description of hurricane relief effort.',
    location: 'Les Cayes, Haiti',
    organizer: 'Haiti Diaspora Coalition',
    category: 'Emergency Relief',
    imageUrl: null,
  },
};

const sampleClimateCampaign: Campaign = {
  id: '2',
  kind: 'climate',
  status: 'active',
  creator: 'GCREATOR1234567890ABCDEF1234567890ABCDEF1234567890A',
  beneficiary: 'GBENEFICIARY1234567890ABCDEF1234567890ABCDEF12345678',
  verifier: 'GVERIFIER1234567890ABCDEF1234567890ABCDEF1234567890A',
  goal: '2000000000',
  raised: '1500000000',
  released: '1000000000',
  milestones: ['1000000000', '1000000000'],
  milestonesReleased: 1,
  deadline: '2027-03-31T23:59:59Z',
  metadataUri: 'https://api.aidline.org/metadata/2',
  createdAt: '2026-08-15T10:00:00Z',
  donorCount: 75,
  metadata: {
    title: 'Coastal Mangrove Reforestation',
    summary:
      'Restoring 15 hectares of coastal mangroves to buffer storm surges and sequester carbon.',
    description: 'Full description of mangrove project.',
    location: 'Saint-Louis du Sud, Haiti',
    organizer: 'EcoRelief Alliance',
    category: 'Climate Resilience',
    imageUrl: null,
  },
};

const meta: Meta<typeof CampaignCard> = {
  title: 'Campaign/CampaignCard',
  component: CampaignCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CampaignCard>;

export const EmergencyCard: Story = {
  args: {
    campaign: sampleEmergencyCampaign,
  },
};

export const ClimateCard: Story = {
  args: {
    campaign: sampleClimateCampaign,
  },
};

export const CancelledWithRefunds: Story = {
  args: {
    campaign: {
      ...sampleEmergencyCampaign,
      id: '3',
      status: 'cancelled',
      raised: '800000000',
      released: '200000000',
      refunded: '300000000',
      milestonesReleased: 1,
      metadata: {
        ...sampleEmergencyCampaign.metadata!,
        title: 'Cancelled Relief Drive',
        summary: 'A campaign that ended early and returned unspent donor funds.',
      },
    },
  },
};

export const CardWithPhotoCover: Story = {
  args: {
    campaign: {
      ...sampleEmergencyCampaign,
      id: '4',
      metadata: {
        ...sampleEmergencyCampaign.metadata!,
        imageUrl:
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
export const BrokenPhotoFallbackCard: Story = {
  args: {
    campaign: {
      ...sampleEmergencyCampaign,
      metadata: {
        ...sampleEmergencyCampaign.metadata!,
        imageUrl: 'https://example.invalid/broken-image.jpg',
      },
    },
  },
};
