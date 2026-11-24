import { en, es, fr, type MessageKey } from './messages';

export type { MessageKey } from './messages';

export const LOCALES = ['en', 'fr', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Each language is named in itself, so a reader can find theirs whatever language is showing. */
export const LOCALE_NAME: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
};

/** The tag to hand to `Intl` for dates and numbers in each language. English keeps the en-GB style. */
export const INTL_TAG: Record<Locale, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  es: 'es-ES',
};

export const LOCALE_STORAGE_KEY = 'aidline_locale';

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, fr, es };

export type MessageVars = Record<string, string | number>;

/** Keys that have `<base>.one` and `<base>.other` forms. */
export type PluralBase = {
  [K in MessageKey]: K extends `${infer Base}.other` ? Base : never;
}[MessageKey];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the language to show. A saved choice always wins. Without one, the first language the
 * browser lists that Aidline supports is used (`fr-CA` counts as `fr`), then English.
 */
export function resolveLocale(
  saved: string | null | undefined,
  preferred: readonly string[] = [],
): Locale {
  if (isLocale(saved)) return saved;
  for (const tag of preferred) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

function fill(text: string, vars?: MessageVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Looks a message up, falling back to English, and fills in `{placeholders}`. */
export function translate(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  return fill(catalogs[locale][key] ?? en[key], vars);
}

/** Picks the `.one` or `.other` form for `count` in `locale`. `{count}` is filled in for you. */
export function translatePlural(
  locale: Locale,
  base: PluralBase,
  count: number,
  vars: MessageVars = {},
): string {
  const form = new Intl.PluralRules(locale).select(count) === 'one' ? 'one' : 'other';
  return translate(locale, `${base}.${form}` as MessageKey, { ...vars, count });
}
