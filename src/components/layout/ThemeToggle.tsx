'use client';

import { useSyncExternalStore } from 'react';

import { T } from '@/components/i18n/T';
import { useI18n } from '@/components/i18n/I18nProvider';
import { isTheme, THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

const listeners = new Set<() => void>();
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

function readTheme(): Theme {
  const selected = document.documentElement.dataset.theme;
  if (isTheme(selected)) return selected;
  return window.matchMedia(DARK_MODE_QUERY).matches ? 'dark' : 'light';
}

function readSavedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : null;
  } catch {
    return null;
  }
}

function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia(DARK_MODE_QUERY);
  const onSystemChange = () => {
    if (!isTheme(document.documentElement.dataset.theme)) listener();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;

    const saved = readSavedTheme();
    if (saved) {
      document.documentElement.dataset.theme = saved;
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    listener();
  };

  media.addEventListener('change', onSystemChange);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', onSystemChange);
    window.removeEventListener('storage', onStorage);
  };
}

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The selected theme remains active until the page is reloaded.
  }
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'light');
  const { t } = useI18n();

  return (
    <button
      type="button"
      className="btn btn-secondary mt-4"
      aria-label={t('footer.toggleTheme')}
      aria-pressed={theme === 'dark'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <T k={theme === 'dark' ? 'footer.themeDark' : 'footer.themeLight'} />
    </button>
  );
}
