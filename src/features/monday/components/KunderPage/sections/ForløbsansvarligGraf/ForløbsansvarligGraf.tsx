'use client';

import { useMemo } from 'react';
import type { MondayKundeItem } from '@/features/monday/types/monday.types';

type Props = { kunder: MondayKundeItem[] };

type PersonData = {
  navn: string;
  aktive: number;
  nye: number;
  total: number;
};

export function ForløbsansvarligGraf({ kunder }: Props) {
  const data = useMemo<PersonData[]>(() => {
    const map = new Map<string, { aktive: number; nye: number }>();

    for (const k of kunder) {
      const navn = k.forløbsansvarlig?.trim() || 'Ikke tildelt';
      if (!map.has(navn)) map.set(navn, { aktive: 0, nye: 0 });
      const entry = map.get(navn)!;
      if (k.gruppe === 'aktive_forloeb') entry.aktive++;
      else if (k.gruppe === 'nye_forloeb') entry.nye++;
    }

    return [...map.entries()]
      .map(([navn, t]) => ({ navn, aktive: t.aktive, nye: t.nye, total: t.aktive + t.nye }))
      .sort((a, b) => b.total - a.total);
  }, [kunder]);

  if (data.length === 0) return null;

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Kunder pr. forløbsansvarlig</span>
        <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-primary)', display: 'inline-block' }} />
            Aktive
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} />
            Nye
          </span>
        </div>
      </div>
      <div className="bosted-detail-kort-body" style={{ gap: '0.6rem' }}>
        {data.map((d) => {
          const aktivPct = Math.round((d.aktive / maxTotal) * 100);
          const nyPct = Math.round((d.nye / maxTotal) * 100);
          return (
            <div key={d.navn} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--fw-medium)' }}>
                  {d.navn}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {d.total} i alt
                </span>
              </div>
              <div style={{ display: 'flex', gap: '2px', height: '10px', borderRadius: '3px', overflow: 'hidden', background: 'var(--color-border-light)' }}>
                {d.aktive > 0 && (
                  <div
                    style={{ width: `${aktivPct}%`, background: 'var(--color-primary)', borderRadius: '3px 0 0 3px', transition: 'width 0.3s' }}
                    title={`Aktive: ${d.aktive}`}
                  />
                )}
                {d.nye > 0 && (
                  <div
                    style={{ width: `${nyPct}%`, background: '#16a34a', borderRadius: d.aktive === 0 ? '3px' : '0 3px 3px 0', transition: 'width 0.3s' }}
                    title={`Nye forløb: ${d.nye}`}
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {d.aktive > 0 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                    {d.aktive} aktive
                  </span>
                )}
                {d.nye > 0 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                    {d.nye} nye forløb
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
