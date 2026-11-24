import type { Metadata } from 'next';

import { T } from '@/components/i18n/T';
import { Container } from '@/components/ui/Container';
import { VerifierQueue } from '@/components/verifier/VerifierQueue';

export const metadata: Metadata = { title: 'Verifier queue', robots: { index: false } };

export default function VerifyPage() {
  return (
    <Container className="pt-12">
      <p className="kicker">
        <T k="verify.kicker" />
      </p>
      <h1 className="mt-3 max-w-3xl text-[2.75rem]">
        <T k="verify.title" />
      </h1>
      <p className="mt-5 max-w-2xl text-[1.0625rem]">
        <T k="verify.intro" />
      </p>

      <section className="mt-12">
        <VerifierQueue />
      </section>
    </Container>
  );
}
