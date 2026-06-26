// src/app/dashboard/kommuner/page.tsx

import { KommunerPage } from '@/features/kommuner/components/KommunerPage';
import { hentKommunerOversigt } from '@/features/kommuner/services/KommunerService';

export const revalidate = 86400;

export default async function KommunerSide() {
  const kommuner = await hentKommunerOversigt();
  return <KommunerPage kommuner={kommuner} />;
}
