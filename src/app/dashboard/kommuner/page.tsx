export const dynamic = 'force-dynamic';

// src/app/dashboard/kommuner/page.tsx

import { KommunerPage } from '@/features/kommuner/components/KommunerPage';
import { hentKommunerOversigt } from '@/features/kommuner/services/KommunerService';

type Props = {
  searchParams: Promise<{ fra?: string; til?: string }>;
};

export default async function KommunerSide({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  const kommuner = await hentKommunerOversigt(fra, til);
  return <KommunerPage kommuner={kommuner} />;
}
