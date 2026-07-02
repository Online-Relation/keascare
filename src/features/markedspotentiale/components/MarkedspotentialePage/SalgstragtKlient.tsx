'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { SalgsFunnel } from '@/features/dashboard/types/dashboard.types';

type TrinBosted = {
  id: string;
  stps_tilbud_navn: string | null;
  kommune: string | null;
  fund_niveau: string | null;
  rapport_dato: string | null;
  monday_item_id: string | null;
};

const TRIN_FARVER = [
  { bg: '#f0f9ff', border: '#bae6fd', tekst: '#0369a1' },
  { bg: '#fef9c3', border: '#fde68a', tekst: '#92400e' },
  { bg: '#ffedd5', border: '#fed7aa', tekst: '#c2410c' },
  { bg: '#dcfce7', border: '#bbf7d0', tekst: '#15803d' },
];

const TRIN_KEYS = ['med-fund', 'kritisk-stoerre', 'ikke-bearbejdet', 'kunder'];

const FUND_BADGE: Record<string, { label: string; color: string }> = {
  kritisk: { label: 'Kritiske fund', color: '#dc2626' },
  stoerre: { label: 'Større fund', color: '#d97706' },
  mindre: { label: 'Mindre fund', color: '#ca8a04' },
  ingen: { label: 'Ingen fund', color: '#16a34a' },
};

type Props = {
  funnel: SalgsFunnel;
  fra?: string;
  til?: string;
};

export function SalgstragtKlient({ funnel, fra, til }: Props) {
  const [åbentTrin, setÅbentTrin] = useState<string | null>(null);
  const [bosteder, setBosteder] = useState<Record<string, TrinBosted[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  async function toggleTrin(key: string) {
    if (åbentTrin === key) {
      setÅbentTrin(null);
      return;
    }
    setÅbentTrin(key);
    if (bosteder[key]) return;

    setLoading((l) => ({ ...l, [key]: true }));
    try {
      const params = new URLSearchParams({ trin: key });
      if (fra) params.set('fra', fra);
      if (til) params.set('til', til);
      const res = await fetch(`/api/markedspotentiale/trin-bosteder?${params}`);
      const data = await res.json();
      setBosteder((b) => ({ ...b, [key]: data }));
    } finally {
      setLoading((l) => ({ ...l, [key]: false }));
    }
  }

  const n = funnel.trin.length;

  return (
    <div className="mp-funnel-trin-liste">
      {funnel.trin.map((trin, i) => {
        const tragPct = 100 - (i / Math.max(n - 1, 1)) * 60;
        const farve = TRIN_FARVER[i] ?? TRIN_FARVER[0];
        const næste = funnel.trin[i + 1];
        const konvPct = næste && trin.antal > 0
          ? Math.round((næste.antal / trin.antal) * 100)
          : null;
        const key = TRIN_KEYS[i];
        const åben = åbentTrin === key;
        const trinBosteder = bosteder[key] ?? [];

        return (
          <div key={trin.label} className="mp-funnel-trin-wrapper">
            <button
              className="mp-funnel-trin mp-funnel-trin--klik"
              style={{ borderColor: farve.border, backgroundColor: farve.bg, width: `${tragPct}%` }}
              onClick={() => toggleTrin(key)}
              aria-expanded={åben}
            >
              <div className="mp-funnel-trin-indhold">
                <div className="mp-funnel-trin-venstre">
                  <span className="mp-funnel-trin-num" style={{ color: farve.tekst }}>{i + 1}</span>
                  <div>
                    <div className="mp-funnel-trin-label">{trin.label}</div>
                    <div className="mp-funnel-trin-beskrivelse">{trin.beskrivelse}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="mp-funnel-trin-antal" style={{ color: farve.tekst }}>
                    {trin.antal.toLocaleString('da-DK')}
                  </div>
                  {åben
                    ? <ChevronUp size={16} color={farve.tekst} />
                    : <ChevronDown size={16} color={farve.tekst} />
                  }
                </div>
              </div>
            </button>

            {åben && (
              <div className="mp-funnel-trin-liste-panel" style={{ width: `${tragPct}%`, borderColor: farve.border }}>
                {loading[key] ? (
                  <div className="mp-funnel-liste-loading">Henter bosteder…</div>
                ) : trinBosteder.length === 0 ? (
                  <div className="mp-funnel-liste-loading">Ingen bosteder fundet</div>
                ) : (
                  <table className="mp-funnel-bosted-tabel">
                    <thead>
                      <tr>
                        <th>Bosted</th>
                        <th>Kommune</th>
                        <th>Fund</th>
                        <th>Rapport</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {trinBosteder.map((b) => {
                        const fundInfo = FUND_BADGE[b.fund_niveau ?? ''];
                        return (
                          <tr key={b.id}>
                            <td>
                              <Link href={`/dashboard/bosteder/${b.id}`} className="mp-funnel-bosted-link">
                                {b.stps_tilbud_navn ?? '—'}
                              </Link>
                            </td>
                            <td className="mp-funnel-bosted-muted">{b.kommune ?? '—'}</td>
                            <td>
                              {fundInfo && (
                                <span className="mp-funnel-fund-badge" style={{ color: fundInfo.color }}>
                                  {fundInfo.label}
                                </span>
                              )}
                            </td>
                            <td className="mp-funnel-bosted-muted">
                              {b.rapport_dato ? new Date(b.rapport_dato).toLocaleDateString('da-DK') : '—'}
                            </td>
                            <td>
                              <Link
                                href={`/dashboard/bosteder/${b.id}`}
                                className="btn btn-ghost btn-sm"
                                title="Se bosted"
                              >
                                <ExternalLink size={13} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {konvPct !== null && (
              <div className="mp-funnel-pil">↓ {konvPct}% videre</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
