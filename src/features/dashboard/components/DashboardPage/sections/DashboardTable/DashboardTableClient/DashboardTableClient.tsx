// src/features/dashboard/components/DashboardPage/sections/DashboardTable/DashboardTableClient/DashboardTableClient.tsx

'use client';

import { useState } from 'react';
import type { Bosted } from '@/features/dashboard/types/dashboard.types';
import { TableRow } from '../TableRow';
import { TablePagination } from '../TablePagination';

type DashboardTableClientProps = {
  bosteder: Bosted[];
};

const RÆKKER_PER_SIDE = 10;

const kolonner = [
  'Bosted',
  'Kommune',
  'Region',
  'Tilsynsform',
  'STPS fund',
  'Rapportdato',
  'Fokus i rapporten',
  'Handling',
];

export function DashboardTableClient({ bosteder }: DashboardTableClientProps) {
  const [side, setSide] = useState(1);

  const totalSider = Math.max(1, Math.ceil(bosteder.length / RÆKKER_PER_SIDE));
  const fraNr = (side - 1) * RÆKKER_PER_SIDE + 1;
  const tilNr = Math.min(side * RÆKKER_PER_SIDE, bosteder.length);
  const synligeBosteder = bosteder.slice(fraNr - 1, tilNr);

  return (
    <>
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
            {synligeBosteder.map((bosted) => (
              <TableRow key={bosted.id} bosted={bosted} />
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        side={side}
        totalSider={totalSider}
        totalAntal={bosteder.length}
        fraNr={fraNr}
        tilNr={tilNr}
        onForrige={() => setSide((s) => Math.max(1, s - 1))}
        onNaeste={() => setSide((s) => Math.min(totalSider, s + 1))}
      />
    </>
  );
}
