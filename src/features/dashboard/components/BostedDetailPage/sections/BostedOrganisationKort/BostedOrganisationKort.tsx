// src/features/dashboard/components/BostedDetailPage/sections/BostedOrganisationKort/BostedOrganisationKort.tsx

import { Building2, Phone, Mail, User } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';

type Props = { bosted: BostedDetail };
type Felt = { label: string; value: string | null };

function FeltRække({ label, value }: Felt) {
  return (
    <div className="bosted-detail-field">
      <span className="bosted-detail-field-label">{label}</span>
      {value
        ? <span className="bosted-detail-field-value">{value}</span>
        : <span className="bosted-detail-placeholder">Mangler data</span>
      }
    </div>
  );
}

export function BostedOrganisationKort({ bosted }: Props) {
  const pladser = bosted.pladser ?? bosted.tpPladser ?? null;
  const kommune = bosted.tpKommune ?? bosted.kommune ?? null;

  const harKontakt = bosted.tpKontaktperson || bosted.tpTelefon || bosted.tpEmail;

  return (
    <>
      <div className="bosted-detail-kort">
        <div className="bosted-detail-kort-header">
          <Building2 size={15} />
          <span className="bosted-detail-kort-titel">Bostedinformation</span>
        </div>
        <div className="bosted-detail-kort-body">
          <FeltRække label="CVR-nummer" value={bosted.cvr} />
          {bosted.tpPNummer && <FeltRække label="P-nummer" value={bosted.tpPNummer} />}
          <FeltRække label="Adresse" value={bosted.adresse} />
          <FeltRække label="Kommune" value={kommune} />
          <FeltRække label="Antal pladser" value={pladser} />
          <FeltRække label="Tilbudstype" value={bosted.tpTilbudstype} />
        </div>
      </div>

      {harKontakt && (
        <div className="bosted-detail-kort">
          <div className="bosted-detail-kort-header">
            <User size={15} />
            <span className="bosted-detail-kort-titel">Kontaktperson</span>
          </div>
          <div className="bosted-detail-kort-body">
            {bosted.tpKontaktperson && <FeltRække label="Navn" value={bosted.tpKontaktperson} />}
            {bosted.tpTelefon && (
              <div className="bosted-detail-field">
                <span className="bosted-detail-field-label">Telefon</span>
                <a href={`tel:${bosted.tpTelefon}`} className="bosted-detail-field-value bosted-kontakt-link">
                  <Phone size={12} />
                  {bosted.tpTelefon}
                </a>
              </div>
            )}
            {bosted.tpEmail && (
              <div className="bosted-detail-field">
                <span className="bosted-detail-field-label">Email</span>
                <a href={`mailto:${bosted.tpEmail}`} className="bosted-detail-field-value bosted-kontakt-link">
                  <Mail size={12} />
                  {bosted.tpEmail}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
