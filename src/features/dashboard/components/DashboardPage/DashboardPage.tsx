// src/features/dashboard/components/DashboardPage/DashboardPage.tsx

import type { DashboardData } from '@/features/dashboard/types/dashboard.types';
import { DashboardKpis } from './sections/DashboardKpis';
import { DashboardTable } from './sections/DashboardTable';
import { DashboardBottomPanels } from './sections/DashboardBottomPanels';

type DashboardPageProps = {
  data: DashboardData;
};

export function DashboardPage({ data }: DashboardPageProps) {
  return (
    <main className="dashboard-main">
      <div className="dashboard-content">
        <DashboardKpis kpis={data.kpis} />
        <DashboardTable bosteder={data.bosteder} />
        <DashboardBottomPanels
          data={{
            tilbudsportalen: data.tilbudsportalen,
            stpsFordeling: data.stpsFordeling,
            topKommuner: data.topKommuner,
          }}
        />
      </div>
    </main>
  );
}
