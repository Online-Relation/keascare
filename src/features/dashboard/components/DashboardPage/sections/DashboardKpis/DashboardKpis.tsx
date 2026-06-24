// src/features/dashboard/components/DashboardPage/sections/DashboardKpis/DashboardKpis.tsx

import type { KpiItem } from '@/features/dashboard/types/dashboard.types';
import { KpiCard } from './KpiCard';

type DashboardKpisProps = {
  kpis: KpiItem[];
};

export function DashboardKpis({ kpis }: DashboardKpisProps) {
  return (
    <div className="dashboard-kpis">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
