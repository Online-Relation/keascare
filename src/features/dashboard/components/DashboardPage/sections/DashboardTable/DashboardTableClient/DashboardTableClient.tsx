'use client';

import { useState } from 'react';
import type { Bosted } from '@/features/dashboard/types/dashboard.types';
import type { CvrSignal } from '@/features/cvr/types/cvr.types';
import { TableRow } from '../TableRow';
import { CvrSignalRow } from '../CvrSignalRow';
import { TablePagination } from '../TablePagination';

type Props = {
  bosteder: Bosted[];
  cvrSignaler: CvrSignal[];
};

type Kilde = 'alle' | 'stps' | 'cvr';

const RÆKKER_PER_SIDE = 10;

const kolonner = [
  'Bosted', 'Kommune', 'Region', 'Tilsynsform',
  'Signal', 'Dato', 'Fokus / Branche', 'Monday', 'Data', 'Handling',
];

export function DashboardTableClient({ bosteder, cvrSignaler }: Props) {
  const [kilde, setKilde] = useState<Kilde>('alle');
  const [side, setSide] = useState(1);

  const filtreredeBosteder = kilde === 'cvr' ? [] : bosteder;
  const filtreredeCvr = kilde === 'stps' ? [] : cvrSignaler;
  const totalAntal = filtreredeBosteder.length + filtreredeCvr.length;

  const totalSider = Math.max(1, Math.ceil(totalAntal / RÆKKER_PER_SIDE));
  const fra = (side - 1) * RÆKKER_PER_SIDE;
  const til = fra + RÆKKER_PER_SIDE;

  // Sæt STPS-rækker først, CVR-rækker bagefter
  const alleRækker = [
    ...filtreredeBosteder.map((b) => ({ type: 'stps' as const, data: b })),
    ...filtreredeCvr.map((c) => ({ type: 'cvr' as const, data: c })),
  ];
  const synligeRækker = alleRækker.slice(fra, til);

  function skiftKilde(ny: Kilde) {
    setKilde(ny);
    setSide(1);
  }

  return (
    <>
      <div className="dashboard-section-header">
        <div>
          <h2 className="dashboard-section-title">Markedssignaler</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
            {totalAntal} signaler fundet
          </p>
        </div>
        <div className="kunder-filter-gruppe">
          {(['alle', 'stps', 'cvr'] as Kilde[]).map((k) => (
            <button
              key={k}
              className={`kunder-filter-knap${kilde === k ? ' aktiv' : ''}`}
              onClick={() => skiftKilde(k)}
            >
              {k === 'alle' ? `Alle (${bosteder.length + cvrSignaler.length})`
                : k === 'stps' ? `STPS-rapport (${bosteder.length})`
                : `Ny CVR (${cvrSignaler.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {kolonner.map((kol) => (
                <th key={kol}>{kol}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {synligeRækker.map((r) =>
              r.type === 'stps'
                ? <TableRow key={r.data.id} bosted={r.data} />
                : <CvrSignalRow key={r.data.id} signal={r.data} />
            )}
            {synligeRækker.length === 0 && (
              <tr>
                <td colSpan={kolonner.length} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem', fontSize: 'var(--text-sm)' }}>
                  {kilde === 'cvr'
                    ? 'Ingen CVR-signaler endnu — afventer adgang til distribution.virk.dk'
                    : 'Ingen signaler fundet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        side={side}
        totalSider={totalSider}
        totalAntal={totalAntal}
        fraNr={fra + 1}
        tilNr={Math.min(til, totalAntal)}
        onForrige={() => setSide((s) => Math.max(1, s - 1))}
        onNaeste={() => setSide((s) => Math.min(totalSider, s + 1))}
      />
    </>
  );
}
