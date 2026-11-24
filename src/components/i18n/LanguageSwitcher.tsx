'use client';

import { isLocale, LOCALES, LOCALE_NAME } from '@/i18n';

import { useI18n } from './I18nProvider';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
      <label htmlFor="language-select" className="sr-only">
        {t('lang.label')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
        className="rounded-[2px] border border-rule bg-paper px-2 py-0.5 font-mono text-xs text-ink transition-colors hover:bg-paper-raised focus:outline-none focus:ring-1 focus:ring-ink"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_NAME[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
