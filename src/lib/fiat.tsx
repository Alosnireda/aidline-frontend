'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { config } from '@/lib/config';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN';

export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'NGN'];

export interface Rates {
  usd: number;
  eur: number;
  gbp: number;
  ngn: number;
}

interface FiatContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Rates | null;
  loading: boolean;
  error: boolean;
  /** Takes an amount in stroops, as the API and the contract use. */
  formatFiat: (stroops: string | bigint) => string | null;
}

const FiatContext = createContext<FiatContextValue | null>(null);

const STORAGE_KEY = 'aidline_currency';

// The chosen currency lives in localStorage. Reading it through an external
// store keeps the server render (USD) and the first client render in sync,
// and storage access is guarded because it can throw in private browsing.
const currencyListeners = new Set<() => void>();

function readCurrency(): Currency {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Currency | null;
    return saved && CURRENCIES.includes(saved) ? saved : 'USD';
  } catch {
    return 'USD';
  }
}

function subscribeCurrency(listener: () => void) {
  currencyListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    currencyListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * Converts an amount in stroops (string or bigint, as returned by the API)
 * into an approximate fiat string such as "~ $12.40". Returns null for
 * invalid, zero or negative amounts.
 */
export function stroopsToFiat(
  stroops: string | bigint,
  rate: number,
  currency: Currency,
): string | null {
  let units: bigint;
  try {
    units = BigInt(stroops);
  } catch {
    return null;
  }
  if (units <= 0n || rate <= 0) return null;
  const xlm = Number(units) / 10 ** config.tokenDecimals;
  const value = xlm * rate;
  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: value < 1 ? 4 : 2,
    }).format(value);
    return `~ ${formatted}`;
  } catch {
    return `~ ${value.toFixed(2)} ${currency}`;
  }
}

/** Rates older than this are no longer shown, even when every refresh since has failed. */
export const RATES_MAX_AGE_MS = 10 * 60_000;

/** The last good rates and when they were fetched (ms since the epoch). */
export interface RatesSnapshot {
  rates: Rates | null;
  fetchedAt: number | null;
}

export const NO_RATES: RatesSnapshot = { rates: null, fetchedAt: null };

/** A refresh succeeded: the new rates replace the old ones. */
export function afterFetchSuccess(rates: Rates, now: number): RatesSnapshot {
  return { rates, fetchedAt: now };
}

/**
 * A refresh failed: keep the last good rates, so one bad request does not hide
 * every estimate, unless they are older than RATES_MAX_AGE_MS, in which case
 * they are dropped so a very stale price is never shown.
 */
export function afterFetchFailure(prev: RatesSnapshot, now: number): RatesSnapshot {
  if (prev.rates === null || prev.fetchedAt === null) return NO_RATES;
  return now - prev.fetchedAt > RATES_MAX_AGE_MS ? NO_RATES : prev;
}

/** Fetches the XLM price in every supported currency. */
async function fetchStellarRates(): Promise<Rates> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd,eur,gbp,ngn',
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error('Price fetch failed');
  const data = await res.json();
  if (!data?.stellar) throw new Error('Invalid rate format');
  return {
    usd: Number(data.stellar.usd) || 0,
    eur: Number(data.stellar.eur) || 0,
    gbp: Number(data.stellar.gbp) || 0,
    ngn: Number(data.stellar.ngn) || 0,
  };
}

export function FiatProvider({ children }: { children: React.ReactNode }) {
  const currency = useSyncExternalStore(subscribeCurrency, readCurrency, () => 'USD' as Currency);
  const [snapshot, setSnapshot] = useState<RatesSnapshot>(NO_RATES);
  const rates = snapshot.rates;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const setCurrency = useCallback((c: Currency) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // Storage blocked: the choice still applies until the page reloads.
    }
    currencyListeners.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchStellarRates()
        .then((next) => {
          if (cancelled) return;
          setSnapshot(afterFetchSuccess(next, Date.now()));
          setError(false);
        })
        .catch(() => {
          if (cancelled) return;
          setError(true);
          // Keep the last good rates; only very old ones are dropped.
          setSnapshot((prev) => afterFetchFailure(prev, Date.now()));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    void load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const formatFiat = useCallback(
    (stroops: string | bigint): string | null => {
      const rate = rates?.[currency.toLowerCase() as keyof Rates];
      return rate ? stroopsToFiat(stroops, rate, currency) : null;
    },
    [currency, rates],
  );

  return (
    <FiatContext.Provider value={{ currency, setCurrency, rates, loading, error, formatFiat }}>
      {children}
    </FiatContext.Provider>
  );
}

export function useFiat(): FiatContextValue {
  const ctx = useContext(FiatContext);
  if (!ctx) {
    throw new Error('useFiat must be used within a FiatProvider');
  }
  return ctx;
}
