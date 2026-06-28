// src/app/dashboard/markedsdata/page.tsx

import { MarkedsdataPage } from '@/features/markedsdata/components/MarkedsdataPage';
import { hentDstKommuneData } from '@/lib/api/DstClient';
import { hentDashboardData } from '@/features/dashboard/services/DashboardService/dashboardService';

export const revalidate = 0;

export default async function MarkedsdataSide() {
  const [dstData, dashboardData] = await Promise.all([
    hentDstKommuneData(),
    hentDashboardData(),
  ]);

  return <MarkedsdataPage data={dstData} antalBosteder={dashboardData.bosteder.length} />;
}
