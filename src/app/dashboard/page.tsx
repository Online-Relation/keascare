// src/app/dashboard/page.tsx

import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { dashboardMockData } from '@/features/dashboard/data/DashboardMockData';

export default function DashboardRoute() {
  return <DashboardPage data={dashboardMockData} />;
}
