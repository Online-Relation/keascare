// src/features/dashboard/components/BostedDetailPage/sections/BostedOrganisationKort/BostedOrganisationKort.tsx

import { Building2, Phone, Mail, User, Globe, MapPin, Shield } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';

type Props = { bosted: BostedDetail };
type Felt = { label: string; value: string | null; placeholder?: string };

function FeltRække({ label, value, placeholder = 'Mangler data' }: Felt) {
  return (
    <div className="bosted-detail-field">
      <span className="bosted-detail-field-label">{label}</span>
      {value
        ? <span className="bosted-detail-field-value">{value}</span>
        : <span className="bosted-detail-placeholder">{placeholder}</span>
      }
    </div>
  );
}

export function BostedOrganisationKort({ bosted }: Props) {
  // Fallback: Tilbudsportalen-adresse er den fysiske adresse, CVR-adresse er juridisk
  const adresse = bosted.tpAdresse ?? bosted.adresse ?? null;
  // Pladser pr. paragraf foretrækkes over total
  const pladserVærdi = bosted.tpPladsePrParagraf ?? bosted.tpPladser ?? bosted.pladser ?? null;
  const erTpMatchet = !!bosted.tpTilbudstype || !!bosted.tpPNummer;
  const pladserPlaceholder = erTpMatchet ? 'Ikke oplyst på Tilbudsportalen' : 'Mangler data';
  const pladser = pladserVærdi;
  const kommune = bosted.tpKommune ?? bosted.kommune ?? null;

  const harKontakt = bosted.tpLeder || bosted.tpKontaktperson || bosted.tpTelefon || bosted.tpEmail;

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
          {adresse && (
            <div className="bosted-detail-field">
              <span className="bosted-detail-field-label">Adresse</span>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(adresse)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bosted-detail-field-value bosted-kontakt-link"
              >
                <MapPin size={12} />
                {adresse}
              </a>
            </div>
          )}
          {!adresse && <FeltRække label="Adresse" value={null} />}
          <FeltRække label="Kommune" value={kommune} />
          <FeltRække label="Pladser" value={pladser} placeholder={pladserPlaceholder} />
          <FeltRække label="Tilbudstype" value={bosted.tpTilbudstype} />
          {bosted.tpVirksomhedsNavn && <FeltRække label="Virksomhed" value={bosted.tpVirksomhedsNavn} />}
        </div>
      </div>

      {harKontakt && (
        <div className="bosted-detail-kort">
          <div className="bosted-detail-kort-header">
            <User size={15} />
            <span className="bosted-detail-kort-titel">Kontakt</span>
          </div>
          <div className="bosted-detail-kort-body">
            {(bosted.tpLeder ?? bosted.tpKontaktperson) && (
              <FeltRække label="Leder" value={bosted.tpLeder ?? bosted.tpKontaktperson} />
            )}
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
            {bosted.tpWebsite && (
              <div className="bosted-detail-field">
                <span className="bosted-detail-field-label">Website</span>
                <a href={bosted.tpWebsite} target="_blank" rel="noopener noreferrer" className="bosted-detail-field-value bosted-kontakt-link">
                  <Globe size={12} />
                  {bosted.tpWebsite.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {bosted.tpTilsynsmyndighed && (
        <div className="bosted-detail-kort">
          <div className="bosted-detail-kort-header">
            <Shield size={15} />
            <span className="bosted-detail-kort-titel">Tilsyn</span>
          </div>
          <div className="bosted-detail-kort-body">
            <FeltRække label="Tilsynsførende" value={bosted.tpTilsynsmyndighed} />
          </div>
        </div>
      )}
    </>
  );
}
