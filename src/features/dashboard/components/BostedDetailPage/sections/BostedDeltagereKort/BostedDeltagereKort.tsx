'use client';

// src/features/dashboard/components/BostedDetailPage/sections/BostedDeltagereKort/BostedDeltagereKort.tsx

import { Users } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import type { TilsynDeltager } from '@/features/stps/scraper/StpsPdfParser';

type Props = {
  bosted: BostedDetail;
};

function DeltagereGruppe({ titel, deltagere }: { titel: string; deltagere: TilsynDeltager[] }) {
  return (
    <div>
      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        {titel}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {deltagere.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--fw-medium)' }}>
              {d.navn}
            </span>
            {d.titel && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {d.titel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BostedDeltagereKort({ bosted }: Props) {
  const harStps = bosted.tilsynDeltagereStps && bosted.tilsynDeltagereStps.length > 0;

  if (!harStps) return null;

  return (
    <div className="bosted-detail-kort" style={{ marginTop: '1.25rem' }}>
      <div className="bosted-detail-kort-header">
        <Users size={15} />
        <span className="bosted-detail-kort-titel">STPS-inspektører</span>
      </div>
      <div className="bosted-detail-kort-body">
        <DeltagereGruppe
          titel="Tilsynet blev foretaget af"
          deltagere={bosted.tilsynDeltagereStps!}
        />
      </div>
    </div>
  );
}
