'use client';

import { useMemo } from 'react';
import type { MondayKundeItem } from '@/features/monday/types/monday.types';

type Props = { kunder: MondayKundeItem[] };

type MånedData = { måned: string; aktive: number; nye: number };

function parseDato(dato: string | null): Date | null {
  if (!dato) return null;
  const d = new Date(dato);
  return isNaN(d.getTime()) ? null : d;
}

function månedNøgle(dato: Date): string {
  return `${dato.getFullYear()}-${String(dato.getMonth() + 1).padStart(2, '0')}`;
}

function månedLabel(nøgle: string): string {
  const [år, mnd] = nøgle.split('-');
  const navne = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return `${navne[parseInt(mnd) - 1]} ${år}`;
}

export function KunderVækstGraf({ kunder }: Props) {
  const data = useMemo<MånedData[]>(() => {
    const map = new Map<string, { aktive: number; nye: number }>();

    for (const k of kunder) {
      const dato = parseDato(k.oprettetDato);
      if (!dato) continue;
      const nøgle = månedNøgle(dato);
      if (!map.has(nøgle)) map.set(nøgle, { aktive: 0, nye: 0 });
      const entry = map.get(nøgle)!;
      if (k.gruppe === 'aktive_forloeb') entry.aktive++;
      else if (k.gruppe === 'nye_forloeb') entry.nye++;
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([nøgle, tæller]) => ({ måned: månedLabel(nøgle), ...tæller }));
  }, [kunder]);

  if (data.length === 0) {
    return (
      <div className="bosted-detail-kort">
        <div className="bosted-detail-kort-header">
          <span className="bosted-detail-kort-titel">Vækst måned for måned</span>
        </div>
        <div className="bosted-detail-kort-body">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Ingen datodata tilgængelig fra Monday endnu.
          </p>
        </div>
      </div>
    );
  }

  const maxVærdi = Math.max(...data.map((d) => d.aktive + d.nye), 1);

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Vækst måned for måned</span>
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
      <div className="bosted-detail-kort-body">
        <div className="kunder-graf-wrapper">
          {data.map((d) => {
            const aktivH = Math.round((d.aktive / maxVærdi) * 100);
            const nyH = Math.round((d.nye / maxVærdi) * 100);
            return (
              <div key={d.måned} className="kunder-graf-kolonne">
                <div className="kunder-graf-søjler">
                  {d.aktive > 0 && (
                    <div
                      className="kunder-graf-søjle"
                      style={{ height: `${aktivH}%`, background: 'var(--color-primary)' }}
                      title={`Aktive: ${d.aktive}`}
                    />
                  )}
                  {d.nye > 0 && (
                    <div
                      className="kunder-graf-søjle"
                      style={{ height: `${nyH}%`, background: '#16a34a' }}
                      title={`Nye: ${d.nye}`}
                    />
                  )}
                </div>
                <span className="kunder-graf-label">{d.måned}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
