'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  resolveLocale,
  translate,
  translatePlural,
  type Locale,
  type MessageKey,
  type MessageVars,
  type PluralBase,
} from '@/i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: MessageVars) => string;
  /** Picks the singular or plural form of `base` for `count`. */
  tn: (base: PluralBase, count: number, vars?: MessageVars) => string;
}

// Outside the provider (Storybook, tests) the interface simply reads in English.
const fallback: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
  tn: (base, count, vars) => translatePlural(DEFAULT_LOCALE, base, count, vars),
};

const I18nContext = createContext<I18nContextValue>(fallback);

// The chosen language lives in localStorage and is read through an external store, the same
// way the currency choice is. The server render (English) and the first client render match, so
// there is no hydration mismatch, and a returning reader switches over straight after hydration.
// Storage access is guarded because it can throw in private browsing.
const listeners = new Set<() => void>();

/** Remembers the choice for this visit when storage is blocked. */
let chosenThisVisit: string | null = null;

function readLocale(): Locale {
  let saved: string | null = chosenThisVisit;
  try {
    saved = window.localStorage.getItem(LOCALE_STORAGE_KEY) ?? saved;
  } catch {
    // Storage blocked: fall back to the choice made on this page, if any.
  }
  const preferred = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language];
  return resolveLocale(saved, preferred);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => DEFAULT_LOCALE);

  const setLocale = useCallback((next: Locale) => {
    chosenThisVisit = next;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies until the page reloads.
    }
    listeners.forEach((listener) => listener());
  }, []);

  // Keeps the page's declared language in step, for screen readers and hyphenation.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
      tn: (base, count, vars) => translatePlural(locale, base, count, vars),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
