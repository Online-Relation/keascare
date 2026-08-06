// src/features/dashboard/components/BostedDetailPage/sections/KundeKort/KundeKort.tsx

'use client';

import { Building2 } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import type { KundePakke } from '@/features/monday/services/MondayProdukterService';
import { useBrugerRolle } from '@/features/auth/hooks/useBrugerRolle';

type Props = {
  bosted: BostedDetail;
  pakker: KundePakke[];
};

export function KundeKort({ bosted, pakker }: Props) {
  const { rolle } = useBrugerRolle();
  if (bosted.mondayKunde !== 'kunde') return null;
  if (rolle === 'sygeplejerske') return null;

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <Building2 size={15} />
        <span className="bosted-detail-kort-titel">Kunde i Monday</span>
        {bosted.mondayGruppe && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.72rem',
            color: 'var(--color-text-muted)',
            fontWeight: 400,
          }}>
            {bosted.mondayGruppe}
          </span>
        )}
      </div>

      <div className="bosted-detail-kort-body">
        {bosted.mondayPrimaerSygeplejerske && (
          <div className="bosted-detail-field" style={{ marginBottom: '0.75rem' }}>
            <span className="bosted-detail-field-label">Primær sygeplejerske</span>
            <span className="bosted-detail-field-value">{bosted.mondayPrimaerSygeplejerske}</span>
          </div>
        )}
        {pakker.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {pakker.map((p, i) => (
              <span
                key={i}
                style={{
                  background: p.farve,
                  color: p.tekstFarve,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.navn}
                {p.startdato && (
                  <span style={{ opacity: 0.75, fontWeight: 400, fontSize: '0.72rem' }}>
                    fra {p.startdato}
                  </span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Ingen aktive pakker registreret i Monday
          </p>
        )}
      </div>
    </div>
  );
}
