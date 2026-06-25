// src/features/dashboard/components/DashboardPage/sections/DashboardTable/DashboardTable.tsx

import type { Bosted } from '@/features/dashboard/types/dashboard.types';
import { DashboardTableClient } from './DashboardTableClient';
import { Filter } from 'lucide-react';

type DashboardTableProps = {
  bosteder: Bosted[];
};

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

      <DashboardTableClient bosteder={bosteder} />
    </div>
  );
}
