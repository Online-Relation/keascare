'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { MondayKundeItem } from '@/features/monday/types/monday.types';

type Props = { kunder: MondayKundeItem[] };

const MONDAY_BOARD_URL = 'https://onlinerelation.monday.com/boards';

export function KunderTabel({ kunder }: Props) {
  const [filter, setFilter] = useState<'alle' | 'aktive' | 'nye'>('alle');
  const [stpsMap, setStpsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/monday/stps-match')
      .then((r) => r.json())
      .then((d) => { if (d && typeof d === 'object') setStpsMap(d); })
      .catch(() => {});
  }, []);

  const filtrerede = kunder
    .filter((k) => {
      if (filter === 'aktive') return k.gruppe === 'aktive_forloeb';
      if (filter === 'nye') return k.gruppe === 'nye_forloeb';
      return true;
    })
    .sort((a, b) => {
      if (!a.oprettetDato && !b.oprettetDato) return 0;
      if (!a.oprettetDato) return 1;
      if (!b.oprettetDato) return -1;
      return new Date(b.oprettetDato).getTime() - new Date(a.oprettetDato).getTime();
    });

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Kunder ({filtrerede.length})</span>
        <div className="kunder-filter-gruppe">
          {(['alle', 'aktive', 'nye'] as const).map((v) => (
            <button
              key={v}
              className={`kunder-filter-knap${filter === v ? ' aktiv' : ''}`}
              onClick={() => setFilter(v)}
            >
              {v === 'alle' ? 'Alle' : v === 'aktive' ? 'Aktive' : 'Nye forløb'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="kunder-tabel">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>Status</th>
              <th>Forløbsansvarlig</th>
              <th>Oprettet</th>
              <th>Opfølgning</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrerede.map((k) => {
              const stpsId = stpsMap[k.mondayId];
              return (
                <tr key={k.mondayId}>
                  <td className="kunder-tabel-navn">
                    {stpsId ? (
                      <Link
                        href={`/dashboard/bosteder/${stpsId}`}
                        style={{ color: 'var(--color-primary)', fontWeight: 'var(--fw-medium)', textDecoration: 'none' }}
                        className="kunder-bosted-link"
                      >
                        {k.navn}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }} title="Ikke fundet i STPS-systemet">
                        {k.navn}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${k.gruppe === 'aktive_forloeb' ? 'badge-success' : 'badge-info'}`}>
                      {k.gruppeNavn}
                    </span>
                  </td>
                  <td className="kunder-tabel-muted">{k.forløbsansvarlig ?? '—'}</td>
                  <td className="kunder-tabel-muted">
                    {k.oprettetDato ? new Date(k.oprettetDato).toLocaleDateString('da-DK') : '—'}
                  </td>
                  <td className="kunder-tabel-muted">
                    {k.opfølgningsdato ? new Date(k.opfølgningsdato).toLocaleDateString('da-DK') : '—'}
                  </td>
                  <td>
                    <a
                      href={`${MONDAY_BOARD_URL}/${process.env.NEXT_PUBLIC_MONDAY_BOARD_ID}/pulses/${k.mondayId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      title="Åbn i Monday"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
