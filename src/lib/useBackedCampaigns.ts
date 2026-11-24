'use client';

import { useEffect, useState } from 'react';

import { useOptionalWallet } from '@/components/wallet/WalletProvider';

import { loadBackedCampaigns } from './backed';

interface Loaded {
  address: string;
  ids: ReadonlySet<string>;
}

/**
 * The ids of the campaigns the connected wallet has donated to, or null while that is unknown:
 * no wallet connected, still loading, or the API could not be reached. Cards simply show no
 * mark in those cases.
 */
export function useBackedCampaigns(): ReadonlySet<string> | null {
  const address = useOptionalWallet()?.address ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    loadBackedCampaigns(address)
      .then((ids) => {
        if (!cancelled) setLoaded({ address, ids });
      })
      .catch(() => {
        // Not knowing is fine: no card is marked.
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return address && loaded?.address === address ? loaded.ids : null;
}
