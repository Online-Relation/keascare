// src/features/dashboard/components/BostedDetailPage/sections/BostedOrganisationKort/BostedOrganisationKort.tsx

import { Building2, Info } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';

type BostedOrganisationKortProps = {
  bosted: BostedDetail;
};

type Felt = { label: string; value: string | null };

export function BostedOrganisationKort({ bosted }: BostedOrganisationKortProps) {
  const felter: Felt[] = [
    { label: 'CVR-nummer', value: bosted.cvr },
    { label: 'Adresse', value: bosted.adresse },
    { label: 'Antal pladser', value: bosted.pladser },
    { label: 'Driftsform', value: null },
    { label: 'Tilbudstype', value: null },
  ];

  const manglerTilbudsportalen = !bosted.pdfBehandlet || (!bosted.adresse && !bosted.cvr && !bosted.pladser);

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <Building2 size={15} />
        <span className="bosted-detail-kort-titel">Bostedinformation</span>
      </div>

      <div className="bosted-detail-kort-body">
        {felter.map(({ label, value }) => (
          <div key={label} className="bosted-detail-field">
            <span className="bosted-detail-field-label">{label}</span>
            {value
              ? <span className="bosted-detail-field-value">{value}</span>
              : <span className="bosted-detail-placeholder">Mangler data</span>
            }
          </div>
        ))}

        {manglerTilbudsportalen && (
          <div className="bosted-detail-mangler-boks">
            <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem', color: 'var(--color-primary)' }} />
            <span>
              Tilbudsportalen er ikke koblet endnu. Driftsform og tilbudstype hentes herfra i næste version.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
