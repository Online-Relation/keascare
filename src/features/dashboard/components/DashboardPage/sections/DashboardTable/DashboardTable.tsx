// src/features/dashboard/components/DashboardPage/sections/DashboardTable/DashboardTable.tsx

import type { Bosted } from '@/features/dashboard/types/dashboard.types';
import type { CvrSignal } from '@/features/cvr/types/cvr.types';
import { DashboardTableClient } from './DashboardTableClient';

type DashboardTableProps = {
  bosteder: Bosted[];
  cvrSignaler: CvrSignal[];
};

export function DashboardTable({ bosteder, cvrSignaler }: DashboardTableProps) {
  return (
    <div className="dashboard-table-wrapper">
      <DashboardTableClient bosteder={bosteder} cvrSignaler={cvrSignaler} />
    </div>
  );
}
