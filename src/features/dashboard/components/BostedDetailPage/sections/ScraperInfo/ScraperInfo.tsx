'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

type Props = {
  kørselKl: number; // time (0-23) for næste planlagte kørsel
  scraperDato: string | null; // ISO dato for hvornår bostedet kom i systemet
  label?: string; // fx "Synology TP-scraper" eller "CVR-ansatte"
};

function næsteKørsel(kl: number): Date {
  const nu = new Date();
  const mål = new Date();
  mål.setHours(kl, 0, 0, 0);
  if (mål <= nu) mål.setDate(mål.getDate() + 1);
  return mål;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const sek = Math.floor(ms / 1000);
  const t = Math.floor(sek / 3600);
  const m = Math.floor((sek % 3600) / 60);
  const s = sek % 60;
  return `${String(t).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function beregnForsøg(scraperDato: string | null): number {
  if (!scraperDato) return 0;
  const start = new Date(scraperDato);
  const nu = new Date();
  const dage = Math.floor((nu.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, dage);
}

export function ScraperInfo({ kørselKl, scraperDato, label }: Props) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    function opdater() {
      const diff = næsteKørsel(kørselKl).getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    }
    opdater();
    const id = setInterval(opdater, 1000);
    return () => clearInterval(id);
  }, [kørselKl]);

  const forsøg = beregnForsøg(scraperDato);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '0.75rem',
      paddingTop: '0.6rem',
      borderTop: '1px solid var(--color-border)',
      fontSize: '0.68rem',
      color: 'var(--color-text-muted)',
      flexWrap: 'wrap',
    }}>
      <Clock size={11} />
      <span>Næste opdatering kl. {String(kørselKl).padStart(2, '0')}:00 — om <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}</strong></span>
      {forsøg > 0 && (
        <span style={{ marginLeft: 'auto', opacity: 0.75 }}>{forsøg} {forsøg === 1 ? 'forsøg' : 'forsøg'} foretaget</span>
      )}
      {label && <span style={{ marginLeft: forsøg > 0 ? undefined : 'auto', opacity: 0.6 }}>({label})</span>}
    </div>
  );
}
