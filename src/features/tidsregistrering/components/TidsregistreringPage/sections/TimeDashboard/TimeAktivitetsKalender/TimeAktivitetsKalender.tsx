'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/TimeAktivitetsKalender/TimeAktivitetsKalender.tsx

import { useState } from 'react';
import { formatMinKort } from '@/features/tidsregistrering/utils/DashboardUtils';

type DagData = { dato: string; minutter: number };

type Props = { data: DagData[] };

const UGEDAGE = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const UGER = 26;

function intensitet(min: number): 0 | 1 | 2 | 3 | 4 {
  if (min === 0) return 0;
  if (min < 120) return 1;
  if (min < 240) return 2;
  if (min < 360) return 3;
  return 4;
}

function getMandagUge(fraUger: number): Date {
  const nu = new Date();
  const dag = nu.getDay();
  const dageForMandagDenneUge = dag === 0 ? 6 : dag - 1;
  const mandag = new Date(nu);
  mandag.setDate(nu.getDate() - dageForMandagDenneUge - (fraUger - 1) * 7);
  mandag.setHours(0, 0, 0, 0);
  return mandag;
}

export function TimeAktivitetsKalender({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ dato: string; min: number } | null>(null);

  const dagMap = new Map(data.map((d) => [d.dato, d.minutter]));

  // Byg en 26×7 grid startende fra mandagen 26 uger tilbage
  const startMandag = getMandagUge(UGER);
  const uger: { dato: Date; key: string }[][] = [];

  for (let u = 0; u < UGER; u++) {
    const uge: { dato: Date; key: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const dato = new Date(startMandag);
      dato.setDate(startMandag.getDate() + u * 7 + d);
      uge.push({ dato, key: dato.toISOString().slice(0, 10) });
    }
    uger.push(uge);
  }

  // Månedslabels — vis månedsnavn når måneden skifter
  const månedLabels: { ugeIdx: number; navn: string }[] = [];
  let forrigeMåned = -1;
  uger.forEach((uge, i) => {
    const md = uge[0].dato.getMonth();
    if (md !== forrigeMåned) {
      månedLabels.push({ ugeIdx: i, navn: uge[0].dato.toLocaleDateString('da-DK', { month: 'short' }) });
      forrigeMåned = md;
    }
  });

  const nu = new Date();

  return (
    <div className="tr-dash-sektion tr-dash-kalender-sektion">
      <div className="tr-dash-sektion-hoved">
        <h2 className="tr-dash-sektion-titel">Aktivitetskalender</h2>
        <div className="tr-dash-kalender-legend">
          <span className="tr-dash-kal-label">Færre timer</span>
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className={`tr-dash-kal-celle tr-dash-kal-niveau-${n}`} />
          ))}
          <span className="tr-dash-kal-label">Flere timer</span>
        </div>
      </div>

      <div className="tr-dash-kalender-wrapper">
        {/* Ugedagslabels */}
        <div className="tr-dash-kal-ugedage">
          {UGEDAGE.map((d, i) => (
            <span key={i} className="tr-dash-kal-dagbogstav">{i % 2 === 0 ? d : ''}</span>
          ))}
        </div>

        <div className="tr-dash-kal-scroll">
          {/* Månedslabels */}
          <div className="tr-dash-kal-måneder" style={{ gridTemplateColumns: `repeat(${UGER}, 1fr)` }}>
            {uger.map((_, i) => {
              const ml = månedLabels.find((m) => m.ugeIdx === i);
              return <span key={i} className="tr-dash-kal-måned">{ml?.navn ?? ''}</span>;
            })}
          </div>

          {/* Celle-grid: 7 rækker × 26 kolonner */}
          <div className="tr-dash-kal-grid" style={{ gridTemplateColumns: `repeat(${UGER}, 1fr)` }}>
            {uger.map((uge, ui) =>
              uge.map(({ dato, key }, di) => {
                const min = dagMap.get(key) ?? 0;
                const niv = intensitet(min);
                const erFremtid = dato > nu;
                return (
                  <div
                    key={`${ui}-${di}`}
                    className={`tr-dash-kal-celle tr-dash-kal-niveau-${erFremtid ? 'tom' : niv}`}
                    onMouseEnter={() => !erFremtid && setTooltip({ dato: key, min })}
                    onMouseLeave={() => setTooltip(null)}
                    aria-label={`${key}: ${min > 0 ? formatMinKort(min) : 'ingen registrering'}`}
                  />
                );
              })
            )}
          </div>

          {tooltip && (
            <div className="tr-dash-kal-tooltip">
              {new Date(tooltip.dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })}
              {' · '}
              {tooltip.min > 0 ? formatMinKort(tooltip.min) : 'Ingen registrering'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
