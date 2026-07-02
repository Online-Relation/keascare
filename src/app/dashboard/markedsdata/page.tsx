// src/app/dashboard/markedsdata/page.tsx

import { MarkedsdataPage } from '@/features/markedsdata/components/MarkedsdataPage';
import { hentDstKommuneData } from '@/lib/api/DstClient';
import { hentDashboardData } from '@/features/dashboard/services/DashboardService/dashboardService';

export const revalidate = 0;

type Props = {
  searchParams: Promise<{ fra?: string; til?: string }>;
};

export default async function MarkedsdataSide({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  const [dstData, dashboardData] = await Promise.all([
    hentDstKommuneData(),
    hentDashboardData(fra, til),
  ]);

  return <MarkedsdataPage data={dstData} antalBosteder={dashboardData.bosteder.length} />;
}
