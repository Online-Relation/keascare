'use client';

// src/features/kort/components/KortPage/KortPage.tsx

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { KommuneFilter } from './sections/KommuneFilter';
import { KortLegende, type FundFilter } from './sections/KortLegende';
import type { KortPin } from '@/features/kort/components/DanmarksKort';

const DanmarksKort = dynamic(
  () => import('@/features/kort/components/DanmarksKort').then((m) => m.DanmarksKort),
  { ssr: false, loading: () => <div className="kort-loading">Indlæser kort…</div> },
);

type Props = {
  allePins: KortPin[];
};

function matcherFundFilter(pin: KortPin, aktive: Set<FundFilter>): boolean {
  if (aktive.size === 0) return true;
  for (const filter of aktive) {
    if (filter === 'kunder'  && pin.erKunde) return true;
    if (filter === 'kritisk' && pin.fundNiveau === 'kritisk') return true;
    if (filter === 'stoerre' && pin.fundNiveau === 'stoerre') return true;
    if (filter === 'mindre'  && pin.fundNiveau === 'mindre')  return true;
    if (filter === 'ingen'   && pin.fundNiveau === 'ingen')   return true;
    if (filter === 'ukendt'  && (!pin.fundNiveau || pin.fundNiveau === 'ukendt')) return true;
  }
  return false;
}

export function KortPage({ allePins }: Props) {
  const [valgtKommune,     setValgtKommune]     = useState<string | null>(null);
  const [aktiveFundFiltre, setAktiveFundFiltre] = useState<Set<FundFilter>>(new Set());

  const kommuner = useMemo(() => {
    const set = new Set(allePins.map((p) => p.kommune).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [allePins]);

  const antalPerKommune = useMemo(() => {
    const map: Record<string, number> = {};
    allePins.forEach((p) => {
      if (p.kommune) map[p.kommune] = (map[p.kommune] ?? 0) + 1;
    });
    return map;
  }, [allePins]);

  const vistePins = useMemo(() => {
    return allePins.filter((p) => {
      if (valgtKommune && p.kommune !== valgtKommune) return false;
      return matcherFundFilter(p, aktiveFundFiltre);
    });
  }, [allePins, valgtKommune, aktiveFundFiltre]);

  const toggleFundFilter = useCallback((id: FundFilter) => {
    setAktiveFundFiltre((prev) => {
      const næste = new Set(prev);
      if (næste.has(id)) næste.delete(id); else næste.add(id);
      return næste;
    });
  }, []);

  const geocodetAntal = allePins.filter((p) => p.lat && p.lat !== 0).length;
  const aktivFiltreTekst = aktiveFundFiltre.size > 0
    ? ` · ${vistePins.length} vist`
    : '';

  return (
    <div className="kortside-layout">
      <div className="kortside-venstre">
        <div className="kortside-header">
          <h1 className="kortside-titel">Bosteder på kort</h1>
          <p className="kortside-subtitle">
            {geocodetAntal} af {allePins.length} bosteder har koordinater
            {valgtKommune && ` · ${vistePins.length} i ${valgtKommune}`}
            {!valgtKommune && aktivFiltreTekst}
          </p>
        </div>

        <KortLegende aktive={aktiveFundFiltre} onToggle={toggleFundFilter} />

        <KommuneFilter
          kommuner={kommuner}
          valgt={valgtKommune}
          onVælg={setValgtKommune}
          antalPerKommune={antalPerKommune}
        />
      </div>

      <div className="kortside-højre">
        <DanmarksKort
          pins={vistePins}
          valgtKommune={valgtKommune}
          onVælgKommune={setValgtKommune}
        />
      </div>
    </div>
  );
}
