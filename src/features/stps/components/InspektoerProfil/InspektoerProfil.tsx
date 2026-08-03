'use client';

// src/features/stps/components/InspektoerProfil/InspektoerProfil.tsx

import { ProfilHeader } from './sections/ProfilHeader';
import { ProfilKpiGrid } from './sections/ProfilKpiGrid';
import { ProfilKommunerListe } from './sections/ProfilKommunerListe';
import { ProfilFundListe } from './sections/ProfilFundListe';
import { ProfilRapporterTabel } from './sections/ProfilRapporterTabel';
import { ProfilKolleger } from './sections/ProfilKolleger';
import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoer: InspektoerFuldStat };

export function InspektoerProfil({ inspektoer }: Props) {
  return (
    <div className="profil-side">
      <ProfilHeader inspektoer={inspektoer} />
      <ProfilKpiGrid inspektoer={inspektoer} />

      <div className="profil-grid-2">
        <ProfilFundListe inspektoer={inspektoer} />
        <ProfilKommunerListe inspektoer={inspektoer} />
      </div>

      <ProfilKolleger inspektoer={inspektoer} />

      <ProfilRapporterTabel inspektoer={inspektoer} />

      <div className="profil-sektion profil-ai-placeholder">
        <h2 className="profil-sektion-titel">Analyse af rapportmønstre</h2>
        <p className="profil-ai-tekst">AI-analyse af inspektørens mønstre er planlagt til en kommende version. Her vil der fremgå typiske fokusområder, geografisk arbejdsområde og udvikling i aktivitet.</p>
      </div>
    </div>
  );
}
