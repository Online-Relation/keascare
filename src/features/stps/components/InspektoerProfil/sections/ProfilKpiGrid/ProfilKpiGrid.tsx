'use client';

// src/features/stps/components/InspektoerProfil/sections/ProfilKpiGrid/ProfilKpiGrid.tsx

import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoer: InspektoerFuldStat };

export function ProfilKpiGrid({ inspektoer: ins }: Props) {
  const fundPct    = ins.antal > 0 ? Math.round((ins.antalMedFund / ins.antal) * 100) : 0;
  const kritiskPct = ins.antal > 0 ? Math.round((ins.antalKritiske / ins.antal) * 100) : 0;

  const kort = [
    { tal: ins.antal,               label: 'Tilsyn i alt',            farve: '#4f46e5' },
    { tal: ins.bosteder.length,     label: 'Unikke bosteder',          farve: '#0891b2' },
    { tal: ins.kommuner.length,     label: 'Unikke kommuner',          farve: '#059669' },
    { tal: `${fundPct} %`,          label: 'Rapporter med fund',       farve: '#d97706' },
    { tal: `${kritiskPct} %`,       label: 'Rapporter kritiske fund',  farve: '#dc2626' },
  ];

  return (
    <div className="profil-kpi-grid">
      {kort.map(({ tal, label, farve }) => (
        <div key={label} className="profil-kpi-kort" style={{ borderTop: `3px solid ${farve}` }}>
          <p className="profil-kpi-tal" style={{ color: farve }}>{tal}</p>
          <p className="profil-kpi-label">{label}</p>
        </div>
      ))}
    </div>
  );
}
