export const dynamic = 'force-dynamic';

// src/app/dashboard/alle-rapporter/page.tsx

import { hentRapporterData } from '@/features/rapporter/services/RapporterService';
import { RapporterListeSektion } from '@/features/rapporter/components/RapporterPage/RapporterListeSektion';

export default async function AlleRapporterSide() {
  const data = await hentRapporterData();

  const medRapport = data.rapporter.filter((r) => r.harStpsRapport).length;

  return (
    <div className="dashboard-content">
      <div className="rap-header">
        <div>
          <h1 className="rap-titel">Alle bosteder</h1>
          <p className="rap-undertitel">
            {data.rapporter.length.toLocaleString('da-DK')} bosteder fra Tilbudsportalen
            {medRapport > 0 && ` · ${medRapport.toLocaleString('da-DK')} med STPS-rapport`}
          </p>
        </div>
      </div>
      <RapporterListeSektion rapporter={data.rapporter} />
    </div>
  );
}
