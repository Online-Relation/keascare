'use client';

// src/features/stps/components/InspektoerSide/InspektoerSide.tsx

import { useState, useMemo } from 'react';
import { InspektoerKpiGrid } from './sections/InspektoerKpiGrid';
import { FremhaevetInspektoer } from './sections/FremhaevetInspektoer';
import { InspektoerListe } from './sections/InspektoerListe';
import { InspektoerSoegFilter } from './sections/InspektoerSoegFilter';
import type { InspektoerFuldStat, InspektoerPeriode, InspektoerSortKey } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoerer: InspektoerFuldStat[] };

function filtrerPeriode(ins: InspektoerFuldStat, periode: InspektoerPeriode): InspektoerFuldStat {
  if (periode === 'alle') return ins;
  const nu = new Date();
  let fra: Date;
  if (periode === '30') {
    fra = new Date(nu); fra.setDate(nu.getDate() - 30);
  } else if (periode === '90') {
    fra = new Date(nu); fra.setDate(nu.getDate() - 90);
  } else if (periode === 'aar') {
    fra = new Date(nu.getFullYear(), 0, 1);
  } else {
    fra = new Date(nu.getFullYear() - 1, 0, 1);
    const til = new Date(nu.getFullYear() - 1, 11, 31);
    const rapporter = ins.rapporter.filter((r) => r.dato && r.dato >= fra.toISOString().slice(0, 10) && r.dato <= til.toISOString().slice(0, 10));
    return genberegnStat(ins, rapporter);
  }
  const fraStr = fra.toISOString().slice(0, 10);
  const rapporter = ins.rapporter.filter((r) => r.dato && r.dato >= fraStr);
  return genberegnStat(ins, rapporter);
}

function genberegnStat(ins: InspektoerFuldStat, rapporter: typeof ins.rapporter): InspektoerFuldStat {
  if (rapporter.length === 0) return { ...ins, antal: 0, bosteder: [], kommuner: [], antalMedFund: 0, antalKritiske: 0, rapporter, senesteDato: null };
  const bosteder = [...new Set(rapporter.map((r) => r.bostedNavn))];
  const kommunerSet = new Set<string>();
  for (const r of rapporter) { if (r.kommune) kommunerSet.add(r.kommune); else if (r.region) kommunerSet.add(r.region); }
  const temaMap = new Map<string, number>();
  for (const r of rapporter) { for (const t of r.temaer) temaMap.set(t, (temaMap.get(t) ?? 0) + 1); }
  const mesteFund = [...temaMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tema, antal]) => ({ tema, antal }));
  const datoer = rapporter.map((r) => r.dato).filter(Boolean) as string[];
  return {
    ...ins, antal: rapporter.length, bosteder, kommuner: [...kommunerSet],
    antalMedFund: rapporter.filter((r) => r.fundNiveau !== 'ingen').length,
    antalKritiske: rapporter.filter((r) => r.fundNiveau === 'kritisk').length,
    mesteFund, rapporter,
    senesteDato: datoer.length ? datoer.sort().at(-1)! : null,
  };
}

function sorter(liste: InspektoerFuldStat[], nøgle: InspektoerSortKey): InspektoerFuldStat[] {
  return [...liste].sort((a, b) => {
    switch (nøgle) {
      case 'tilsyn':   return b.antal - a.antal;
      case 'bosteder': return b.bosteder.length - a.bosteder.length;
      case 'kommuner': return b.kommuner.length - a.kommuner.length;
      case 'seneste':  return (b.senesteDato ?? '').localeCompare(a.senesteDato ?? '');
      case 'fund':     return (b.antal > 0 ? b.antalMedFund / b.antal : 0) - (a.antal > 0 ? a.antalMedFund / a.antal : 0);
      case 'kritiske': return (b.antal > 0 ? b.antalKritiske / b.antal : 0) - (a.antal > 0 ? a.antalKritiske / a.antal : 0);
      case 'navn':     return a.navn.localeCompare(b.navn, 'da');
    }
  });
}

export function InspektoerSide({ inspektoerer: råData }: Props) {
  const [søg, setSøg]         = useState('');
  const [periode, setPeriode] = useState<InspektoerPeriode>('alle');
  const [sortKey, setSortKey] = useState<InspektoerSortKey>('tilsyn');

  const behandlet = useMemo(() => {
    let liste = råData.map((i) => filtrerPeriode(i, periode)).filter((i) => i.antal > 0);
    if (søg.trim()) {
      const q = søg.toLowerCase();
      liste = liste.filter((i) =>
        i.navn.toLowerCase().includes(q) ||
        (i.titel ?? '').toLowerCase().includes(q) ||
        i.kommuner.some((k) => k.toLowerCase().includes(q)) ||
        i.bosteder.some((b) => b.toLowerCase().includes(q))
      );
    }
    return sorter(liste, sortKey);
  }, [råData, søg, periode, sortKey]);

  const fremhaevetIdx = behandlet.findIndex((i) => i.antal > 0);
  const fremhaevet    = behandlet[fremhaevetIdx] ?? null;
  const resten        = fremhaevetIdx >= 0 ? [...behandlet.slice(0, fremhaevetIdx), ...behandlet.slice(fremhaevetIdx + 1)] : behandlet;

  return (
    <div className="insp-side">
      <div className="insp-header">
        <h1 className="insp-titel">STPS-inspektører</h1>
        <p className="insp-undertekst">Få overblik over hvilke inspektører der fører tilsyn, hvor bredt de arbejder, og se profiler på den enkelte person.</p>
      </div>

      <InspektoerSoegFilter periode={periode} sorter={sortKey} onPeriode={setPeriode} onSorter={setSortKey} />

      <InspektoerKpiGrid inspektoerer={behandlet} />

      {fremhaevet && <FremhaevetInspektoer inspektoer={fremhaevet} />}

      <div className="insp-liste-hoved">
        <h2 className="insp-liste-titel">Alle inspektører</h2>
        <span className="insp-liste-antal">{behandlet.length} personer</span>
      </div>

      <InspektoerListe inspektoerer={resten} startFra={2} />
    </div>
  );
}
