'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/AfvigelserCard/AfvigelserCard.tsx

import { AlertTriangle } from 'lucide-react';
import { formatMinKort } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Tidsregistrering } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = {
  aktuelle: Tidsregistrering[];    // Valgte periode
  historiske: Tidsregistrering[];  // 8 ugers historik
};

type Afvigelse = {
  katId: string;
  katNavn: string;
  dennePeriodeMin: number;
  snit8UgerMin: number;
  afvigelsePct: number;
};

const AFVIGELSES_GRÆNSE = 75; // % over/under normalt

function getUgeNummer(iso: string): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const ys = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-${Math.ceil(((d.getTime() - ys.getTime()) / 86400000 + 1) / 7)}`;
}

export function AfvigelserCard({ aktuelle, historiske }: Props) {
  // Beregn ugentligt gennemsnit pr. kategori over 8 uger (ekskl. indeværende uge)
  const ugeSet = new Set(historiske.map((r) => getUgeNummer(r.startTid)));
  const faktiskeUger = Math.max(ugeSet.size, 1);

  const snitMap = new Map<string, { navn: string; min: number }>();
  for (const r of historiske) {
    const e = snitMap.get(r.kategoriId) ?? { navn: r.kategoriNavn, min: 0 };
    e.min += r.varighedMinutter ?? 0;
    snitMap.set(r.kategoriId, e);
  }

  // Samlet tid i aktuelle periode pr. kategori
  const aktMap = new Map<string, { navn: string; min: number }>();
  for (const r of aktuelle) {
    const e = aktMap.get(r.kategoriId) ?? { navn: r.kategoriNavn, min: 0 };
    e.min += r.varighedMinutter ?? 0;
    aktMap.set(r.kategoriId, e);
  }

  const afvigelser: Afvigelse[] = [];
  for (const [id, { navn, min: aktMin }] of aktMap) {
    const snitTotal = snitMap.get(id)?.min ?? 0;
    const snitPrUge = snitTotal / faktiskeUger;
    if (snitPrUge === 0) continue;
    const afvigelsePct = Math.round(((aktMin - snitPrUge) / snitPrUge) * 100);
    if (Math.abs(afvigelsePct) >= AFVIGELSES_GRÆNSE) {
      afvigelser.push({ katId: id, katNavn: navn, dennePeriodeMin: aktMin, snit8UgerMin: Math.round(snitPrUge), afvigelsePct });
    }
  }

  afvigelser.sort((a, b) => Math.abs(b.afvigelsePct) - Math.abs(a.afvigelsePct));

  if (afvigelser.length === 0 || historiske.length === 0) {
    return (
      <div className="tr-dash-sektion">
        <h2 className="tr-dash-sektion-titel">Afvigelser</h2>
        <p className="tr-dash-tom">
          {historiske.length === 0
            ? 'Ikke nok historik til at beregne afvigelser.'
            : 'Ingen markante afvigelser denne periode.'}
        </p>
      </div>
    );
  }

  return (
    <div className="tr-dash-sektion">
      <h2 className="tr-dash-sektion-titel">Afvigelser</h2>
      <div className="tr-dash-afvigelser-liste">
        {afvigelser.map((a) => (
          <div key={a.katId} className="tr-dash-afvigelse-rad">
            <AlertTriangle size={14} className="tr-dash-afv-ikon" />
            <div className="tr-dash-afv-info">
              <div className="tr-dash-afv-navn">{a.katNavn}</div>
              <div className="tr-dash-afv-tal">
                Denne periode: {formatMinKort(a.dennePeriodeMin)}
                {' · '}Normalt: {formatMinKort(a.snit8UgerMin)} pr. uge
              </div>
            </div>
            <span className={`tr-dash-afv-pct ${a.afvigelsePct > 0 ? 'over' : 'under'}`}>
              {a.afvigelsePct > 0 ? '+' : ''}{a.afvigelsePct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
