'use client';

// src/features/stps/components/InspektoerSide/sections/InspektoerKpiGrid/InspektoerKpiGrid.tsx

import { Users, ClipboardList, Building2, MapPin } from 'lucide-react';
import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoerer: InspektoerFuldStat[] };

export function InspektoerKpiGrid({ inspektoerer }: Props) {
  const antalTilsyn  = inspektoerer.reduce((s, i) => s + i.antal, 0);
  const antalBosteder = new Set(inspektoerer.flatMap((i) => i.bosteder)).size;
  const antalKommuner = new Set(inspektoerer.flatMap((i) => i.kommuner)).size;

  const kort = [
    { ikon: Users,         tal: inspektoerer.length, label: 'inspektører',  farve: '#4f46e5' },
    { ikon: ClipboardList, tal: antalTilsyn,          label: 'tilsyn',      farve: '#0891b2' },
    { ikon: Building2,     tal: antalBosteder,        label: 'bosteder',    farve: '#059669' },
    { ikon: MapPin,        tal: antalKommuner,        label: 'kommuner',    farve: '#d97706' },
  ];

  return (
    <div className="insp-kpi-grid">
      {kort.map(({ ikon: Ikon, tal, label, farve }) => (
        <div key={label} className="insp-kpi-kort">
          <div className="insp-kpi-ikon" style={{ background: `${farve}18`, color: farve }}>
            <Ikon size={20} />
          </div>
          <div>
            <p className="insp-kpi-tal">{tal}</p>
            <p className="insp-kpi-label">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
