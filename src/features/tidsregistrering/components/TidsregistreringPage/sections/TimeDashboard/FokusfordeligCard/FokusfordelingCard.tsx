'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/FokusfordeligCard/FokusfordelingCard.tsx

import { KATEGORI_FARVER } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Tidsregistrering } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = {
  aktuelle: Tidsregistrering[];
  forrige: Tidsregistrering[];
};

type KatRad = {
  katId: string;
  katNavn: string;
  pctNu: number;
  pctFør: number;
  ændring: number;
  farve: string;
};

function beregnKatPct(regs: Tidsregistrering[]): Map<string, { navn: string; pct: number }> {
  const total = regs.reduce((s, r) => s + (r.varighedMinutter ?? 0), 0);
  const map = new Map<string, { navn: string; min: number }>();
  for (const r of regs) {
    const e = map.get(r.kategoriId) ?? { navn: r.kategoriNavn, min: 0 };
    e.min += r.varighedMinutter ?? 0;
    map.set(r.kategoriId, e);
  }
  const result = new Map<string, { navn: string; pct: number }>();
  for (const [id, { navn, min }] of map) {
    result.set(id, { navn, pct: total > 0 ? Math.round((min / total) * 100) : 0 });
  }
  return result;
}

export function FokusfordelingCard({ aktuelle, forrige }: Props) {
  const nuMap  = beregnKatPct(aktuelle);
  const førMap = beregnKatPct(forrige);

  const rækker: KatRad[] = [];
  let i = 0;
  for (const [id, { navn, pct }] of nuMap) {
    const pctFør = førMap.get(id)?.pct ?? 0;
    rækker.push({
      katId: id, katNavn: navn,
      pctNu: pct, pctFør,
      ændring: pct - pctFør,
      farve: KATEGORI_FARVER[i % KATEGORI_FARVER.length],
    });
    i++;
  }

  rækker.sort((a, b) => b.pctNu - a.pctNu);
  const harForrige = forrige.length > 0;

  return (
    <div className="tr-dash-sektion">
      <h2 className="tr-dash-sektion-titel">Fokusfordeling</h2>
      {rækker.length === 0 ? (
        <p className="tr-dash-tom">Ingen registreringer i perioden.</p>
      ) : (
        <table className="tr-dash-fokus-tabel">
          <thead>
            <tr>
              <th>Område</th>
              <th>Denne periode</th>
              {harForrige && <th>Forrige</th>}
              {harForrige && <th>Ændring</th>}
            </tr>
          </thead>
          <tbody>
            {rækker.map((r) => (
              <tr key={r.katId}>
                <td>
                  <span className="tr-dash-fokus-farve" style={{ background: r.farve }} />
                  {r.katNavn}
                </td>
                <td className="tr-dash-fokus-pct">{r.pctNu}%</td>
                {harForrige && <td className="tr-dash-fokus-pct muted">{r.pctFør}%</td>}
                {harForrige && (
                  <td className="tr-dash-fokus-ændring">
                    {r.ændring === 0 ? '0 pp' : `${r.ændring > 0 ? '+' : ''}${r.ændring} pp`}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
