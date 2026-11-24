'use client';

import type { MessageKey, MessageVars, PluralBase } from '@/i18n';

import { useI18n } from './I18nProvider';

/**
 * Renders a translated message. Server components cannot call `useI18n`, so they use this
 * for their fixed copy: `<T k="card.endingSoon" />`.
 */
export function T({ k, vars }: { k: MessageKey; vars?: MessageVars }) {
  const { t } = useI18n();
  return <>{t(k, vars)}</>;
}

/** Renders the singular or plural form of a message: `<TPlural base="card.donors" count={3} />`. */
export function TPlural({
  base,
  count,
  vars,
}: {
  base: PluralBase;
  count: number;
  vars?: MessageVars;
}) {
  const { tn } = useI18n();
  return <>{tn(base, count, vars)}</>;
}
