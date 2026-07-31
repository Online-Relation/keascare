'use client';

// src/features/kort/components/KortPage/KortPage.tsx

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { KommuneFilter } from './sections/KommuneFilter';
import { KortLegende } from './sections/KortLegende';
import type { KortPin } from '@/features/kort/components/DanmarksKort';

const DanmarksKort = dynamic(
  () => import('@/features/kort/components/DanmarksKort').then((m) => m.DanmarksKort),
  { ssr: false, loading: () => <div className="kort-loading">Indlæser kort…</div> },
);

type Props = {
  allePins: KortPin[];
};

export function KortPage({ allePins }: Props) {
  const [valgtKommune, setValgtKommune] = useState<string | null>(null);

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
    if (!valgtKommune) return allePins;
    return allePins.filter((p) => p.kommune === valgtKommune);
  }, [allePins, valgtKommune]);

  const geocodetAntal = allePins.filter((p) => p.lat && p.lat !== 0).length;

  return (
    <div className="kortside-layout">
      <div className="kortside-venstre">
        <div className="kortside-header">
          <h1 className="kortside-titel">Bosteder på kort</h1>
          <p className="kortside-subtitle">
            {geocodetAntal} af {allePins.length} bosteder har koordinater
            {valgtKommune && ` · Viser ${vistePins.length} i ${valgtKommune}`}
          </p>
        </div>

        <KortLegende />

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
