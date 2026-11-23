'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="en" style={{ background: '#f6f1e7', color: '#1b1a17' }}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#f6f1e7',
          color: '#4a463f',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: 1.6,
        }}
      >
        <main
          style={{
            maxWidth: '42rem',
            margin: '0 auto',
            padding: '5rem 1.5rem 3rem',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#7a7468',
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              margin: '0.75rem 0 0',
              fontFamily: 'Georgia, serif',
              fontSize: '2.25rem',
              fontWeight: 500,
              lineHeight: 1.15,
              color: '#1b1a17',
            }}
          >
            Aidline could not be loaded
          </h1>
          <p style={{ margin: '1rem 0 0' }}>
            An unexpected error occurred. Your funds are not affected.
          </p>
          {error.digest && (
            <p style={{ margin: '1.5rem 0 0', fontSize: '0.875rem', color: '#7a7468' }}>
              Reference:{' '}
              <code style={{ fontFamily: 'ui-monospace, monospace', color: '#1b1a17' }}>
                {error.digest}
              </code>
            </p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '2rem',
              height: '2.75rem',
              padding: '0 1.25rem',
              border: 'none',
              borderRadius: '2px',
              background: '#1b1a17',
              color: '#f6f1e7',
              fontFamily: 'inherit',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
