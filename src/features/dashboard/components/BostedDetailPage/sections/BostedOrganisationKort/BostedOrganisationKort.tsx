// src/features/dashboard/components/BostedDetailPage/sections/BostedOrganisationKort/BostedOrganisationKort.tsx

import { Building2, Info } from 'lucide-react';

const felter = [
  { label: 'CVR-nummer', key: 'cvr' },
  { label: 'Adresse', key: 'adresse' },
  { label: 'Antal pladser', key: 'pladser' },
  { label: 'Driftsform', key: 'driftsform' },
  { label: 'Tilbudstype', key: 'tilbudstype' },
];

export function BostedOrganisationKort() {
  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <Building2 size={15} />
        <span className="bosted-detail-kort-titel">Bostedinformation</span>
      </div>

      <div className="bosted-detail-kort-body">
        {felter.map(({ label }) => (
          <div key={label} className="bosted-detail-field">
            <span className="bosted-detail-field-label">{label}</span>
            <span className="bosted-detail-placeholder">Mangler data</span>
          </div>
        ))}

        <div className="bosted-detail-mangler-boks">
          <Info size={14} style={{ flexShrink: 0, marginTop: '0.1rem', color: 'var(--color-primary)' }} />
          <span>
            Tilbudsportalen er ikke koblet endnu. CVR, adresse, pladser og
            driftsform hentes herfra i næste version.
          </span>
        </div>
      </div>
    </div>
  );
}
