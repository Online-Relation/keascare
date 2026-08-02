'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/TopOpgaverListe/TopOpgaverListe.tsx

import { formatMinKort } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { TopOpgave } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = { topOpgaver: TopOpgave[] };

export function TopOpgaverListe({ topOpgaver }: Props) {
  const maxMin = topOpgaver[0]?.minutter ?? 0;

  return (
    <div className="tr-dash-sektion">
      <h2 className="tr-dash-sektion-titel">Topopgaver</h2>
      {topOpgaver.length === 0 ? (
        <p className="tr-dash-tom">Ingen registreringer i perioden.</p>
      ) : (
        <ol className="tr-dash-top-liste">
          {topOpgaver.map((opgave, i) => (
            <li key={opgave.navn} className="tr-dash-top-rad">
              <span className="tr-dash-top-nr">{i + 1}</span>
              <div className="tr-dash-top-indhold">
                <div className="tr-dash-top-nav-row">
                  <span className="tr-dash-top-navn">{opgave.navn}</span>
                  <span className="tr-dash-top-tid">{formatMinKort(opgave.minutter)}</span>
                </div>
                <div className="tr-dash-top-bar-wrapper">
                  <div
                    className="tr-dash-top-bar-fill"
                    style={{ width: maxMin > 0 ? `${(opgave.minutter / maxMin) * 100}%` : '0%' }}
                  />
                </div>
                <span className="tr-dash-top-kat">{opgave.kategoriNavn}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
