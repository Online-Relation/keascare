'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/InternEksternCard/InternEksternCard.tsx

import { formatMinKort } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Tidsregistrering, TidsregistreringKategori } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = {
  registreringer: Tidsregistrering[];
  kategorier: TidsregistreringKategori[];
};

export function InternEksternCard({ registreringer, kategorier }: Props) {
  const katMap = new Map(kategorier.map((k) => [k.id, k]));
  const harKlassifikation = kategorier.some((k) => k.erEkstern);

  if (!harKlassifikation) {
    return (
      <div className="tr-dash-sektion">
        <h2 className="tr-dash-sektion-titel">Internt vs. eksternt</h2>
        <p className="tr-dash-tom">
          Klassificer kategorier som "Eksternt arbejde" under Kategorier → Indstillinger for at aktivere denne visning.
        </p>
      </div>
    );
  }

  let eksternMin = 0;
  let internMin  = 0;

  for (const r of registreringer) {
    const kat = katMap.get(r.kategoriId);
    const min = r.varighedMinutter ?? 0;
    if (kat?.erEkstern) eksternMin += min;
    else internMin += min;
  }

  const total = internMin + eksternMin;
  const eksternPct = total > 0 ? Math.round((eksternMin / total) * 100) : 0;
  const internPct  = total > 0 ? 100 - eksternPct : 0;

  return (
    <div className="tr-dash-sektion">
      <h2 className="tr-dash-sektion-titel">Internt vs. eksternt</h2>
      {total === 0 ? (
        <p className="tr-dash-tom">Ingen registreringer i perioden.</p>
      ) : (
        <>
          <div className="tr-ie-bar">
            <div className="tr-ie-intern" style={{ width: `${internPct}%` }} title={`Internt: ${internPct}%`} />
            <div className="tr-ie-ekstern" style={{ width: `${eksternPct}%` }} title={`Eksternt: ${eksternPct}%`} />
          </div>
          <div className="tr-ie-labels">
            <div className="tr-ie-label">
              <span className="tr-ie-dot intern" />
              <span>Internt</span>
              <strong>{internPct}%</strong>
              <span className="tr-ie-tid">{formatMinKort(internMin)}</span>
            </div>
            <div className="tr-ie-label">
              <span className="tr-ie-dot ekstern" />
              <span>Eksternt</span>
              <strong>{eksternPct}%</strong>
              <span className="tr-ie-tid">{formatMinKort(eksternMin)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
