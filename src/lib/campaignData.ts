import { cache } from 'react';

import { api } from '@/lib/api';

/**
 * One campaign request per server render. generateMetadata and the page both call this
 * with the same id, so the API is hit once instead of twice.
 */
export const getCampaign = cache((id: string) => api.campaign(id));
