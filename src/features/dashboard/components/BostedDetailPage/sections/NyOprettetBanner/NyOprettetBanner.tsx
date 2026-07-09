'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const SEKUNDER = 20;

export function NyOprettetBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tilbage, setTilbage] = useState(SEKUNDER);
  const [synlig, setSynlig] = useState(false);

  useEffect(() => {
    if (searchParams.get('nyOprettet') !== '1') return;
    setSynlig(true);

    const interval = setInterval(() => {
      setTilbage((n) => {
        if (n <= 1) {
          clearInterval(interval);
          // Reload uden query-param
          const url = new URL(window.location.href);
          url.searchParams.delete('nyOprettet');
          router.replace(url.pathname);
          return 0;
        }
        return n - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [searchParams, router]);

  if (!synlig) return null;

  const procent = ((SEKUNDER - tilbage) / SEKUNDER) * 100;

  return (
    <div style={{
      background: 'var(--color-primary-subtle, #eff6ff)',
      border: '1px solid var(--color-primary-border, #bfdbfe)',
      borderRadius: 'var(--radius-md)',
      padding: '0.875rem 1.25rem',
      marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-primary)' }}>
          Henter data fra CVR-register, regnskab og STPS…
        </p>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Opdaterer om {tilbage}s
        </span>
      </div>
      <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${procent}%`,
          background: 'var(--color-primary)',
          borderRadius: '2px',
          transition: 'width 1s linear',
        }} />
      </div>
    </div>
  );
}
