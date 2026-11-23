'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/verifiers', label: 'Verifiers' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/start', label: 'Start a campaign' },
];

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

  return (
    <nav aria-label={ariaLabel} className={className}>
      {NAV.map((item) => {
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
