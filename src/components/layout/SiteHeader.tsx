import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { Container } from '@/components/ui/Container';
import { CurrencyPicker } from '@/components/ui/CurrencyPicker';
import { WalletButton } from '@/components/wallet/WalletButton';
import { WrongNetworkBanner } from '@/components/wallet/WrongNetworkBanner';
import { config } from '@/lib/config';

import { NavLinks } from './NavLinks';
import { Wordmark } from './Wordmark';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper">
      <WrongNetworkBanner />
      <Container className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Wordmark />
          {config.network !== 'mainnet' && (
            <span className="figure border border-rule px-1.5 py-0.5 text-[0.6875rem] uppercase tracking-wider text-ink-muted">
              {config.network}
            </span>
          )}
        </div>
        <NavLinks
          ariaLabel="Main"
          className="hidden items-center gap-7 text-[0.9375rem] md:flex"
        />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <CurrencyPicker />
          <WalletButton />
        </div>
      </Container>
      <NavLinks
        ariaLabel="Main mobile"
        className="flex gap-6 overflow-x-auto border-t border-rule px-4 py-2.5 text-sm md:hidden"
        itemClassName="shrink-0"
      />
    </header>
  );
}
