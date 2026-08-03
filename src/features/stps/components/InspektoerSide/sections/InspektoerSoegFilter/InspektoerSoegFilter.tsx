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

export function InspektoerSoegFilter({ periode, sorter, onPeriode, onSorter }: Omit<Props, 'søg' | 'onSøg'>) {
  return (
    <div className="insp-filter-bar">
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
