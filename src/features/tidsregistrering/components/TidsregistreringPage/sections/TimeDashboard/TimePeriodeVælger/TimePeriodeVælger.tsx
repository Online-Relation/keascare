'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/TimePeriodeVælger/TimePeriodeVælger.tsx

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Periode } from '@/features/tidsregistrering/types/tidsregistrering.types';

const PERIODER: { value: Periode; label: string }[] = [
  { value: 'denne-uge',     label: 'Denne uge' },
  { value: 'sidste-uge',    label: 'Sidste uge' },
  { value: 'denne-maaned',  label: 'Denne måned' },
  { value: 'sidste-maaned', label: 'Sidste måned' },
  { value: 'dette-aar',     label: 'Dette år' },
];

type Props = {
  periode: Periode;
  periodeLabel: string;
  onChange: (p: Periode) => void;
};

export function TimePeriodeVælger({ periode, periodeLabel, onChange }: Props) {
  const idx = PERIODER.findIndex((p) => p.value === periode);

  return (
    <div className="tr-dash-periode-wrapper">
      <div className="tr-dash-periode-nav">
        <button
          className="tr-dash-periode-pil"
          onClick={() => idx > 0 && onChange(PERIODER[idx - 1].value)}
          disabled={idx === 0}
          aria-label="Forrige periode"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="tr-dash-periode-label">{periodeLabel}</span>
        <button
          className="tr-dash-periode-pil"
          onClick={() => idx < PERIODER.length - 1 && onChange(PERIODER[idx + 1].value)}
          disabled={idx === PERIODER.length - 1}
          aria-label="Næste periode"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <select
        className="tr-dash-periode-select"
        value={periode}
        onChange={(e) => onChange(e.target.value as Periode)}
      >
        {PERIODER.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </div>
  );
}
