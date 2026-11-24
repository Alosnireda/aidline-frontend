'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useI18n } from '@/components/i18n/I18nProvider';
import { useOptionalWallet } from '@/components/wallet/WalletProvider';
import type { MessageKey } from '@/i18n';

interface NavItem {
  href: string;
  label: MessageKey;
}

const NAV: NavItem[] = [
  { href: '/campaigns', label: 'nav.campaigns' },
  { href: '/verifiers', label: 'nav.verifiers' },
  { href: '/how-it-works', label: 'nav.howItWorks' },
  { href: '/start', label: 'nav.start' },
];

/** Only shown once a wallet is connected, since the queue is that wallet's. */
const VERIFY: NavItem = { href: '/verify', label: 'nav.verify' };

export function isNavCurrent(pathname: string | null, href: string): boolean {
  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}

export function NavLinks({
  ariaLabel,
  className,
  itemClassName = '',
}: {
  ariaLabel: string;
  className: string;
  itemClassName?: string;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const connected = Boolean(useOptionalWallet()?.address);
  const items = connected ? [NAV[0], NAV[1], VERIFY, ...NAV.slice(2)] : NAV;

  return (
    <nav aria-label={ariaLabel} className={className}>
      {items.map((item) => {
        const current = isNavCurrent(pathname, item.href);
        const stateClass = current
          ? 'text-ink underline decoration-ink underline-offset-[6px]'
          : 'text-ink-soft hover:text-ink';
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={itemClassName ? `${itemClassName} ${stateClass}` : stateClass}
          >
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
