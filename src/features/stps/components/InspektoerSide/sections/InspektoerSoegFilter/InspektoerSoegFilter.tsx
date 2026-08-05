'use client';

// src/features/stps/components/InspektoerSide/sections/InspektoerSoegFilter/InspektoerSoegFilter.tsx

import { Search } from 'lucide-react';
import type { InspektoerSortKey } from '@/features/stps/types/inspektoer.types';

type Props = {
  søg: string;
  sorter: InspektoerSortKey;
  onSøg: (v: string) => void;
  onSorter: (v: InspektoerSortKey) => void;
};

const SORTER: { value: InspektoerSortKey; label: string }[] = [
  { value: 'tilsyn',   label: 'Flest tilsyn' },
  { value: 'bosteder', label: 'Flest bosteder' },
  { value: 'kommuner', label: 'Flest kommuner' },
  { value: 'seneste',  label: 'Seneste tilsyn' },
  { value: 'fund',     label: 'Højeste andel med fund' },
  { value: 'kritiske', label: 'Højeste andel kritiske' },
  { value: 'navn',     label: 'Alfabetisk' },
];

export function InspektoerSoegFilter({ søg, sorter, onSøg, onSorter }: Props) {
  return (
    <div className="insp-filter-bar">
      <div className="insp-søg-wrap">
        <Search size={14} className="insp-søg-ikon" />
        <input
          className="insp-søg-input"
          type="text"
          placeholder="Søg efter inspektør, kommune eller bosted…"
          value={søg}
          onChange={(e) => onSøg(e.target.value)}
        />
      </div>
      <div className="insp-sorter-wrap">
        <span className="insp-sorter-label">Sorter efter:</span>
        <select className="insp-filter-select" value={sorter} onChange={(e) => onSorter(e.target.value as InspektoerSortKey)}>
          {SORTER.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}
