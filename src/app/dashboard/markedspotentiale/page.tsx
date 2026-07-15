// src/app/dashboard/markedspotentiale/page.tsx

import { MarkedspotentialePage } from '@/features/markedspotentiale/components/MarkedspotentialePage';
import { hentDashboardData } from '@/features/dashboard/services/DashboardService';
import { hentDstKommuneData } from '@/lib/api/DstClient';

type Props = {
  searchParams: Promise<{ fra?: string; til?: string }>;
};

export default async function MarkedspotentialeSide({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  const [dashboardData, dstData] = await Promise.all([
    hentDashboardData(fra, til),
    hentDstKommuneData(),
  ]);
  return <MarkedspotentialePage funnel={dashboardData.salgsFunnel} totalRapporter={dashboardData.totalRapporter} dstData={dstData} fra={fra} til={til} />;
}
