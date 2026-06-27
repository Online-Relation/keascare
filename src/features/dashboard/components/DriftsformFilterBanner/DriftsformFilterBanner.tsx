'use client';
// src/features/dashboard/components/DriftsformFilterBanner/DriftsformFilterBanner.tsx

import { Building2 } from 'lucide-react';
import type { VisFilter } from '@/lib/config/GlobalFilter';

type Props = {
  filter: VisFilter;
  onToggle: () => void;
};

export function DriftsformFilterBanner({ filter, onToggle }: Props) {
  if (filter !== 'privat') return null;

  return (
    <div className="driftsform-banner">
      <Building2 size={13} />
      <span>Viser kun private og selvejende bosteder</span>
      <button className="driftsform-banner-fjern" onClick={onToggle}>
        Vis alle
      </button>
    </div>
  );
}
