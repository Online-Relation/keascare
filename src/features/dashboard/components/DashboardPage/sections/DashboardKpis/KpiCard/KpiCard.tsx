// src/features/dashboard/components/DashboardPage/sections/DashboardKpis/KpiCard/KpiCard.tsx

import type { KpiItem } from '@/features/dashboard/types/dashboard.types';

type KpiCardProps = {
  kpi: KpiItem;
};

export function KpiCard({ kpi }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{kpi.label}</p>
      <p className="kpi-value">{kpi.value}</p>
      <p className="kpi-sub">{kpi.sub}</p>
      {kpi.trend && (
        <p className={kpi.trendPositive ? 'kpi-trend-up' : 'kpi-trend-down'}>
          {kpi.trendPositive ? '↑' : '↓'} {kpi.trend}
        </p>
      )}
    </div>
  );
}
