'use client';

// src/features/kort/components/KortPage/sections/KommuneFilter/KommuneFilter.tsx

import { X } from 'lucide-react';

type Props = {
  kommuner: string[];
  valgt: string | null;
  onVælg: (kommune: string | null) => void;
  antalPerKommune: Record<string, number>;
};

export function KommuneFilter({ kommuner, valgt, onVælg, antalPerKommune }: Props) {
  return (
    <div className="kort-kommune-filter">
      <div className="kort-filter-header">
        <span className="kort-filter-label">Kommune</span>
        {valgt && (
          <button className="kort-filter-ryd" onClick={() => onVælg(null)}>
            <X size={12} /> Ryd
          </button>
        )}
      </div>
      <div className="kort-kommune-liste">
        {kommuner.map((k) => (
          <button
            key={k}
            className={`kort-kommune-knap${valgt === k ? ' aktiv' : ''}`}
            onClick={() => onVælg(valgt === k ? null : k)}
          >
            <span>{k}</span>
            <span className="kort-kommune-antal">{antalPerKommune[k] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
