// src/app/dashboard/rapporter/page.tsx

import { RapporterPage } from '@/features/rapporter/components/RapporterPage';
import { hentRapporterData } from '@/features/rapporter/services/RapporterService';

export const revalidate = 3600;

export default async function RapporterSide() {
  const data = await hentRapporterData();
  return <RapporterPage data={data} />;
}
