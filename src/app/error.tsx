'use client';

import { useEffect, useState } from 'react';

import { Container } from '@/components/ui/Container';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  const copyDigest = async () => {
    if (!error.digest) return;
    try {
      await navigator.clipboard.writeText(error.digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the reference code remains visible to copy manually.
    }
  };

  return (
    <Container className="pt-20">
      <p className="kicker">Something went wrong</p>
      <h1 className="mt-3 text-[2.5rem]">This page could not be loaded</h1>
      <p className="mt-4">
        An unexpected error occurred while loading this page. Your funds are not affected.
      </p>
      {error.digest && (
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          <span>
            Reference: <code className="figure text-ink">{error.digest}</code>
          </span>
          <button
            type="button"
            onClick={copyDigest}
            className="border border-rule px-2.5 py-1 text-xs text-ink-soft hover:border-ink hover:text-ink"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </Container>
  );
}
