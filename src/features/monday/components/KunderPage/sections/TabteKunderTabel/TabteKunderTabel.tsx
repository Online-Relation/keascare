'use client';

import { ExternalLink } from 'lucide-react';
import type { MondayKundeItem } from '@/features/monday/types/monday.types';

type Props = { kunder: MondayKundeItem[] };

const MONDAY_BOARD_URL = 'https://onlinerelation.monday.com/boards';

export function TabteKunderTabel({ kunder }: Props) {
  const tabte = kunder
    .filter((k) => k.gruppe === 'tabt')
    .sort((a, b) => {
      if (!a.oprettetDato && !b.oprettetDato) return 0;
      if (!a.oprettetDato) return 1;
      if (!b.oprettetDato) return -1;
      return new Date(b.oprettetDato).getTime() - new Date(a.oprettetDato).getTime();
    });

  if (tabte.length === 0) return null;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <span className="bosted-detail-kort-titel">Tabte forløb ({tabte.length})</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Bosteder der har afvist KeasCare
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="kunder-tabel">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>Adresse</th>
              <th>Forløbsansvarlig</th>
              <th>Oprettet</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tabte.map((k) => (
              <tr key={k.mondayId}>
                <td className="kunder-tabel-navn">
                  <span style={{ color: 'var(--color-text-muted)' }}>{k.navn}</span>
                </td>
                <td className="kunder-tabel-muted">{k.adresse ?? '—'}</td>
                <td className="kunder-tabel-muted">{k.forløbsansvarlig ?? '—'}</td>
                <td className="kunder-tabel-muted">
                  {k.oprettetDato ? new Date(k.oprettetDato).toLocaleDateString('da-DK') : '—'}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
