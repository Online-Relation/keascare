// src/features/dashboard/components/DashboardPage/sections/DashboardTable/DashboardTable.tsx

import type { Bosted } from '@/features/dashboard/types/dashboard.types';
import { TableRow } from './TableRow';
import { Filter } from 'lucide-react';

type DashboardTableProps = {
  bosteder: Bosted[];
};

const kolonner = [
  'Bosted',
  'Kommune',
  'Pladser',
  'Drift',
  'STPS fund',
  'Rapportdato',
  'Fokus i rapporten',
  'Handling',
];

export function DashboardTable({ bosteder }: DashboardTableProps) {
  return (
    <div className="dashboard-table-wrapper">
      <div className="dashboard-section-header">
        <div>
          <h2 className="dashboard-section-title">Nye tilsynsrapporter</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
            {bosteder.length} bosteder fundet
          </p>
        </div>
        <button className="btn btn-outline btn-sm">
          <Filter size={13} />
          Filtrer
        </button>
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
            {bosteder.map((bosted) => (
              <TableRow key={bosted.id} bosted={bosted} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
