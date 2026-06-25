// src/app/dashboard/page.tsx

import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { hentDashboardData } from '@/features/dashboard/services/DashboardService';

export default async function DashboardRoute() {
  const data = await hentDashboardData();
  return <DashboardPage data={data} />;
}
