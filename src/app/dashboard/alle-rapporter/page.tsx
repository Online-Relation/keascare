export const dynamic = 'force-dynamic';

// src/app/dashboard/alle-rapporter/page.tsx

import { hentRapporterData } from '@/features/rapporter/services/RapporterService';
import { RapporterListeSektion } from '@/features/rapporter/components/RapporterPage/RapporterListeSektion';

type Props = {
  searchParams: Promise<{ fra?: string; til?: string }>;
};

export default async function AlleRapporterSide({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  const data = await hentRapporterData(fra, til);

  return (
    <div className="dashboard-content">
      <div className="rap-header">
        <div>
          <h1 className="rap-titel">Alle rapporter</h1>
          <p className="rap-undertitel">{data.rapporter.length} STPS-tilsynsrapporter · filtrer og søg</p>
        </div>
      </div>
      <RapporterListeSektion rapporter={data.rapporter} />
    </div>
  );
}
