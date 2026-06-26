// src/app/dashboard/rapporter/page.tsx

import { RapporterPage } from '@/features/rapporter/components/RapporterPage';
import { hentRapporterData } from '@/features/rapporter/services/RapporterService';

type Props = {
  searchParams: Promise<{ fra?: string; til?: string }>;
};

export default async function RapporterSide({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  const data = await hentRapporterData(fra, til);
  return <RapporterPage data={data} />;
}
