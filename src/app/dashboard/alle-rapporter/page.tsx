// src/app/dashboard/alle-rapporter/page.tsx

import { hentRapporterData } from '@/features/rapporter/services/RapporterService';
import { RapporterListeSektion } from '@/features/rapporter/components/RapporterPage/RapporterListeSektion';

export default async function AlleRapporterSide() {
  const data = await hentRapporterData();

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
