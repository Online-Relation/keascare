'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Bosted = {
  id: string;
  stps_tilbud_navn: string;
  scraper_dato: string | null;
  rapport_dato: string | null;
  kommune: string | null;
  fund_niveau: string | null;
};

type Svar = { bosteder: Bosted[]; total: number; side: number; antalSider: number };

function formaterDato(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SenesteBosteder() {
  const [side, setSide] = useState(1);
  const [data, setData] = useState<Svar | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/system/seneste-bosteder?side=${side}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [side]);

  return (
    <div className="dashboard-table-wrapper">
      <div className="dashboard-section-header">
        <div>
          <h2 className="dashboard-section-title">Senest opdaterede bosteder</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
            {data ? `${data.total} bosteder i alt` : 'Henter...'}
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>Kommune</th>
              <th>Rapportdato</th>
              <th>Hentet</th>
            </tr>
          </thead>
          <tbody>
            {!data && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Henter...</td></tr>
            )}
            {data?.bosteder.map((b) => (
              <tr key={b.id}>
                <td className="table-cell-bold">
                  <Link href={`/dashboard/bosteder/${b.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'var(--fw-medium)' }}>
                    {b.stps_tilbud_navn}
                  </Link>
                </td>
                <td className="table-cell-muted">{b.kommune?.replace(' Kommune', '') ?? '—'}</td>
                <td className="table-cell-muted">{formaterDato(b.rapport_dato)}</td>
                <td className="table-cell-muted">{formaterDato(b.scraper_dato)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.antalSider > 1 && (
        <div className="rl-pagination">
          <button className="rl-page-knap" onClick={() => setSide((s) => Math.max(1, s - 1))} disabled={side === 1}>
            <ChevronLeft size={15} />
          </button>
          <div className="rl-page-numre">
            {Array.from({ length: data.antalSider }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === data.antalSider || Math.abs(n - side) <= 2)
              .reduce<(number | '…')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) => n === '…'
                ? <span key={`e-${i}`} className="rl-page-ellipsis">…</span>
                : <button key={n} onClick={() => setSide(n as number)} className={`rl-page-num${side === n ? ' rl-page-num--aktiv' : ''}`}>{n}</button>
              )}
          </div>
          <button className="rl-page-knap" onClick={() => setSide((s) => Math.min(data.antalSider, s + 1))} disabled={side === data.antalSider}>
            <ChevronRight size={15} />
          </button>
          <span className="rl-page-info">{(side - 1) * 10 + 1}–{Math.min(side * 10, data.total)} af {data.total}</span>
        </div>
      )}
    </div>
  );
}
