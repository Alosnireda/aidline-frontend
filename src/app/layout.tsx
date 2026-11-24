import type { Metadata } from 'next';

import { I18nProvider } from '@/components/i18n/I18nProvider';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { config } from '@/lib/config';
import { FiatProvider } from '@/lib/fiat';

import { newsreader, plexMono, plexSans } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  // Resolves relative canonical, Open Graph and image URLs against the site origin.
  metadataBase: new URL(config.siteUrl),
  title: {
    default: 'Aidline: diaspora giving you can trace',
    template: '%s · Aidline',
  },
  description:
    'Diaspora communities fund relief and climate work back home. Donations are held in escrow and released milestone by milestone, only after an independent verifier confirms the work. Built on Stellar.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-[2px] focus:border focus:border-ink focus:bg-paper-raised focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:shadow-none"
        >
          Skip to content
        </a>
        <I18nProvider>
          <FiatProvider>
            <WalletProvider>
              <ServiceWorkerRegister />
              <SiteHeader />
              <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
              <SiteFooter />
            </WalletProvider>
          </FiatProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
