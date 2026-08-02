'use client';

// src/features/stps/components/InspektoerSide/sections/InspektoerSoegFilter/InspektoerSoegFilter.tsx

import { Search } from 'lucide-react';
import type { InspektoerPeriode, InspektoerSortKey } from '@/features/stps/types/inspektoer.types';

type Props = {
  søg: string;
  periode: InspektoerPeriode;
  sorter: InspektoerSortKey;
  onSøg: (v: string) => void;
  onPeriode: (v: InspektoerPeriode) => void;
  onSorter: (v: InspektoerSortKey) => void;
};

const PERIODER: { value: InspektoerPeriode; label: string }[] = [
  { value: 'alle',     label: 'Alle tider' },
  { value: '30',       label: 'Seneste 30 dage' },
  { value: '90',       label: 'Seneste 90 dage' },
  { value: 'aar',      label: 'Indeværende år' },
  { value: 'sidsteaar', label: 'Sidste år' },
];

const SORTER: { value: InspektoerSortKey; label: string }[] = [
  { value: 'tilsyn',   label: 'Flest tilsyn' },
  { value: 'bosteder', label: 'Flest bosteder' },
  { value: 'kommuner', label: 'Flest kommuner' },
  { value: 'seneste',  label: 'Seneste tilsyn' },
  { value: 'fund',     label: 'Højeste andel med fund' },
  { value: 'kritiske', label: 'Højeste andel kritiske' },
  { value: 'navn',     label: 'Alfabetisk' },
];

export function InspektoerSoegFilter({ søg, periode, sorter, onSøg, onPeriode, onSorter }: Props) {
  return (
    <div className="insp-filter-bar">
      <div className="insp-soeg-wrap">
        <Search size={15} className="insp-soeg-ikon" />
        <input
          className="insp-soeg-input"
          type="search"
          placeholder="Søg efter inspektør, stilling eller kommune…"
          value={søg}
          onChange={(e) => onSøg(e.target.value)}
        />
      </div>
      <select className="insp-filter-select" value={periode} onChange={(e) => onPeriode(e.target.value as InspektoerPeriode)}>
        {PERIODER.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <div className="insp-sorter-wrap">
        <span className="insp-sorter-label">Sorter efter:</span>
        <select className="insp-filter-select" value={sorter} onChange={(e) => onSorter(e.target.value as InspektoerSortKey)}>
          {SORTER.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}
