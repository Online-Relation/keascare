// src/app/dashboard/page.tsx

import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { hentDashboardData } from '@/features/dashboard/services/DashboardService';

type Props = {
  searchParams: Promise<{ fra?: string; til?: string }>;
};

export default async function DashboardRoute({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  const data = await hentDashboardData(fra, til);
  return <DashboardPage data={data} />;
}
