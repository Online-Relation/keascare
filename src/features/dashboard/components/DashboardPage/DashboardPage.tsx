// src/features/dashboard/components/DashboardPage/DashboardPage.tsx

import type { DashboardData } from '@/features/dashboard/types/dashboard.types';
import { DashboardKpis } from './sections/DashboardKpis';
import { DashboardTable } from './sections/DashboardTable';
import { DashboardBottomPanels } from './sections/DashboardBottomPanels';
import { NovaBanner } from './sections/NovaBanner';

type DashboardPageProps = {
  data: DashboardData;
};

export function DashboardPage({ data }: DashboardPageProps) {
  return (
    <main className="dashboard-main">
      <div className="dashboard-content">
        <NovaBanner data={data} />
        <DashboardKpis kpis={data.kpis} />
        <DashboardTable bosteder={data.bosteder} cvrSignaler={data.cvrSignaler} />
        <DashboardBottomPanels
          data={{
            tilbudsportalen: data.tilbudsportalen,
            stpsFordeling: data.stpsFordeling,
            topKommuner: data.topKommuner,
            datakilder: data.datakilder,
          }}
        />
      </div>
    </main>
  );
}
