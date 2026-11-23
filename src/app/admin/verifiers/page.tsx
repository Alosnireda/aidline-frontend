import type { Metadata } from 'next';

import { AdminVerifierTools } from '@/components/admin/AdminVerifierTools';

// The admin tools need the wallet, so they live in a client component; this
// server page exists so the route can export metadata.
export const metadata: Metadata = {
  title: 'Register verifiers',
  robots: { index: false },
};

export default function AdminVerifiersPage() {
  return <AdminVerifierTools />;
}
