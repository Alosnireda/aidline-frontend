import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCALE,
  INTL_TAG,
  isLocale,
  LOCALE_NAME,
  LOCALES,
  resolveLocale,
  translate,
  translatePlural,
  type Locale,
  type MessageKey,
} from '@/i18n';
import { en, es, fr } from '@/i18n/messages';

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, fr, es };
const keys = Object.keys(en) as MessageKey[];

/** The {placeholders} in a message, sorted, so translations can be compared to the English. */
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('message catalogs', () => {
  it('has the same keys in every language', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(['fr', 'es'] as const)('has a real translation for every key in %s', (locale) => {
    for (const key of keys) {
      const text = catalogs[locale][key];
      expect(text.trim(), `${locale} ${key}`).not.toBe('');
    }
  });

  it.each(['fr', 'es'] as const)('keeps the same placeholders as English in %s', (locale) => {
    for (const key of keys) {
      expect(placeholders(catalogs[locale][key]), `${locale} ${key}`).toEqual(
        placeholders(en[key]),
      );
    }
  });

  it('gives every plural base both a one and an other form', () => {
    const bases = keys.filter((k) => k.endsWith('.other')).map((k) => k.replace(/\.other$/, ''));
    expect(bases.length).toBeGreaterThan(0);
    for (const base of bases) {
      expect(keys, base).toContain(`${base}.one`);
    }
    for (const key of keys.filter((k) => k.endsWith('.one'))) {
      expect(keys, key).toContain(key.replace(/\.one$/, '.other'));
    }
  });

  it.each(LOCALES)('follows the voice rules in DESIGN.md in %s', (locale) => {
    for (const key of keys) {
      const text = catalogs[locale][key];
      expect(text, `${locale} ${key}`).not.toContain('!');
      expect(text, `${locale} ${key}`).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('actually differs from English where a translation is expected', () => {
    for (const key of ['nav.campaigns', 'tx.step.sign', 'verify.title', 'wallet.disconnect'] as const) {
      expect(fr[key]).not.toBe(en[key]);
      expect(es[key]).not.toBe(en[key]);
    }
  });
});

describe('locales', () => {
  it('offers English, French and Spanish, each named in its own language', () => {
    expect(LOCALES).toEqual(['en', 'fr', 'es']);
    expect(LOCALE_NAME).toEqual({ en: 'English', fr: 'Français', es: 'Español' });
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('has a date locale for each language', () => {
    for (const locale of LOCALES) expect(INTL_TAG[locale]).toBeTruthy();
  });

  it('recognises only supported locales', () => {
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});

describe('resolveLocale', () => {
  it('uses a saved choice above everything else', () => {
    expect(resolveLocale('es', ['fr-FR', 'en'])).toBe('es');
  });

  it('ignores a saved value that is not a supported language', () => {
    expect(resolveLocale('de', ['fr'])).toBe('fr');
    expect(resolveLocale('', [])).toBe('en');
  });

  it('falls back to the first supported browser language, matching on the primary tag', () => {
    expect(resolveLocale(null, ['fr-CA', 'en-US'])).toBe('fr');
    expect(resolveLocale(null, ['de-DE', 'es-MX', 'fr'])).toBe('es');
    expect(resolveLocale(undefined, ['ES'])).toBe('es');
  });

  it('defaults to English when nothing matches', () => {
    expect(resolveLocale(null, ['de', 'ja'])).toBe('en');
    expect(resolveLocale(null, [])).toBe('en');
    expect(resolveLocale(null)).toBe('en');
  });
});

describe('translate', () => {
  it('returns the message in the chosen language', () => {
    expect(translate('en', 'nav.campaigns')).toBe('Campaigns');
    expect(translate('fr', 'nav.campaigns')).toBe('Campagnes');
    expect(translate('es', 'nav.campaigns')).toBe('Campañas');
  });

  it('fills in placeholders', () => {
    expect(translate('en', 'card.raisedBy', { name: 'Haiti Diaspora Coalition' })).toBe(
      'Raised by Haiti Diaspora Coalition',
    );
    expect(translate('fr', 'card.milestones', { released: 1, total: 3 })).toBe(
      'Étapes vérifiées : 1 sur 3',
    );
    expect(translate('es', 'card.milestones', { released: 2, total: 5 })).toBe(
      'Hitos verificados: 2 de 5',
    );
    expect(translate('es', 'tx.live', { n: 2, total: 4, step: 'Firmar', description: 'x' })).toBe(
      'Paso 2 de 4: Firmar. x',
    );
  });

  it('leaves a placeholder alone when no value is given for it', () => {
    expect(translate('en', 'card.raisedBy', {})).toBe('Raised by {name}');
    expect(translate('en', 'card.raisedBy')).toBe('Raised by {name}');
  });

  it('does not translate a campaign name passed in as a value', () => {
    for (const locale of LOCALES) {
      expect(translate(locale, 'card.raisedBy', { name: 'Red Relief Network' })).toContain(
        'Red Relief Network',
      );
    }
  });
});

describe('translatePlural', () => {
  it('picks the singular for one and the plural otherwise in English', () => {
    expect(translatePlural('en', 'card.donors', 1)).toBe('1 donor');
    expect(translatePlural('en', 'card.donors', 0)).toBe('0 donors');
    expect(translatePlural('en', 'card.donors', 28)).toBe('28 donors');
  });

  it('follows French rules, where zero is singular', () => {
    expect(translatePlural('fr', 'card.donors', 0)).toBe('0 donateur');
    expect(translatePlural('fr', 'card.donors', 1)).toBe('1 donateur');
    expect(translatePlural('fr', 'card.donors', 2)).toBe('2 donateurs');
  });

  it('follows Spanish rules', () => {
    expect(translatePlural('es', 'card.donors', 1)).toBe('1 donante');
    expect(translatePlural('es', 'card.donors', 5)).toBe('5 donantes');
    expect(translatePlural('es', 'deadline.days', 1)).toBe('Queda 1 día');
    expect(translatePlural('es', 'deadline.days', 7)).toBe('Quedan 7 días');
  });

  it('fills in extra placeholders as well as the count', () => {
    expect(translatePlural('en', 'verify.count', 3)).toBe('3 campaigns to review');
    expect(translatePlural('en', 'verify.count', 1)).toBe('1 campaign to review');
  });
});
