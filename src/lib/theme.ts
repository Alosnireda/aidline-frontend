export const THEME_STORAGE_KEY = 'aidline_theme';

export type Theme = 'light' | 'dark';

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export const THEME_INIT_SCRIPT = `try {
  const theme = localStorage.getItem('${THEME_STORAGE_KEY}');
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.dataset.theme = theme;
  }
} catch {}`;
