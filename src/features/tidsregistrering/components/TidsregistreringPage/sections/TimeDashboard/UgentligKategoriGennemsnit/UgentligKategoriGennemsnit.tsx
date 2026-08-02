'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/UgentligKategoriGennemsnit/UgentligKategoriGennemsnit.tsx

import { formatMinKort } from '@/features/tidsregistrering/utils/DashboardUtils';
import { KATEGORI_FARVER } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Tidsregistrering } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = { registreringer: Tidsregistrering[]; antalUger: number };

type KatSnit = { katId: string; katNavn: string; snit: number; total: number; farve: string };

function getUgeNummer(dato: Date): string {
  const d = new Date(dato);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const uge = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-${uge}`;
}

export function UgentligKategoriGennemsnit({ registreringer, antalUger }: Props) {
  // Tæl unikke uger med data
  const ugeSet = new Set(registreringer.map((r) => getUgeNummer(new Date(r.startTid))));
  const faktiskeUger = Math.max(ugeSet.size, 1);

  // Summer minutter pr. kategori
  const katMap = new Map<string, { navn: string; minutter: number }>();
  for (const r of registreringer) {
    const e = katMap.get(r.kategoriId) ?? { navn: r.kategoriNavn, minutter: 0 };
    e.minutter += r.varighedMinutter ?? 0;
    katMap.set(r.kategoriId, e);
  }

  const snit: KatSnit[] = [...katMap.entries()]
    .sort((a, b) => b[1].minutter - a[1].minutter)
    .map(([id, { navn, minutter }], i) => ({
      katId: id,
      katNavn: navn,
      total: minutter,
      snit: Math.round(minutter / faktiskeUger),
      farve: KATEGORI_FARVER[i % KATEGORI_FARVER.length],
    }));

  const maxSnit = snit[0]?.snit ?? 0;

  return (
    <div className="tr-dash-sektion">
      <div className="tr-dash-sektion-hoved">
        <h2 className="tr-dash-sektion-titel">Gennemsnit pr. uge</h2>
        <span className="tr-dash-uge-periode">Seneste {faktiskeUger} {faktiskeUger === 1 ? 'uge' : 'uger'}</span>
      </div>

      {snit.length === 0 ? (
        <p className="tr-dash-tom">Ingen data endnu.</p>
      ) : (
        <div className="tr-dash-uge-liste">
          {snit.map((k) => (
            <div key={k.katId} className="tr-dash-uge-rad">
              <span className="tr-dash-uge-farve" style={{ background: k.farve }} />
              <span className="tr-dash-uge-navn">{k.katNavn}</span>
              <div className="tr-dash-uge-bar-wrapper">
                <div
                  className="tr-dash-uge-bar-fill"
                  style={{ width: maxSnit > 0 ? `${(k.snit / maxSnit) * 100}%` : '0%', background: k.farve }}
                />
              </div>
              <span className="tr-dash-uge-snit">{formatMinKort(k.snit)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
