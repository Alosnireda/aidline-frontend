import Link from 'next/link';

import { T } from '@/components/i18n/T';
import { Container } from '@/components/ui/Container';
import { config, explorer } from '@/lib/config';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <Container className="grid gap-10 py-12 text-sm md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-serif text-lg text-ink">
            <T k="footer.tagline" />
          </p>
          <p className="mt-3 text-ink-muted">
            <T k="footer.disclaimer" vars={{ network: config.network }} />
          </p>
        </div>
        <div>
          <p className="kicker mb-3">
            <T k="footer.platform" />
          </p>
          <ul className="space-y-2">
            <li>
              <Link className="link" href="/campaigns">
                <T k="nav.campaigns" />
              </Link>
            </li>
            <li>
              <Link className="link" href="/verifiers">
                <T k="nav.verifiers" />
              </Link>
            </li>
            <li>
              <Link className="link" href="/start">
                <T k="nav.start" />
              </Link>
            </li>
            <li>
              <Link className="link" href="/how-it-works">
                <T k="nav.howItWorks" />
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="kicker mb-3">
            <T k="footer.openSource" />
          </p>
          <ul className="space-y-2">
            <li>
              <a className="link" href="https://github.com/aidline-org/aidline-contracts">
                <T k="footer.contracts" />
              </a>
            </li>
            <li>
              <a className="link" href="https://github.com/aidline-org/aidline-backend">
                <T k="footer.backend" />
              </a>
            </li>
            <li>
              <a className="link" href="https://github.com/aidline-org/aidline-frontend">
                <T k="footer.frontend" />
              </a>
            </li>
            {config.contractId && (
              <li>
                <a className="link" href={explorer.contract(config.contractId)}>
                  <T k="footer.contractOnExplorer" />
                </a>
              </li>
            )}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
