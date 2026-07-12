// src/features/dashboard/components/BostedDetailPage/sections/BostedOrganisationKort/BostedOrganisationKort.tsx

'use client';

import { useState } from 'react';
import { Building2, Phone, Mail, User, Globe, MapPin, TrendingUp, RefreshCw, Shield } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import { ScraperInfo } from '../ScraperInfo/ScraperInfo';

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

function HentTpKnap({ bostedId, cvr }: { bostedId: string; cvr: string }) {
  const [status, setStatus] = useState<'idle' | 'henter' | 'ok' | 'fejl'>('idle');
  const [fejlTekst, setFejlTekst] = useState('');

  async function hentTp() {
    setStatus('henter');
    try {
      const res = await fetch('/api/scrapers/berig-bosted-tp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bostedId, cvr }),
      });
      const data = await res.json() as { ok: boolean; fejl?: string; afdelinger?: number };
      if (data.ok) {
        setStatus('ok');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setStatus('fejl');
        setFejlTekst(data.fejl ?? 'Ukendt fejl');
      }
    } catch {
      setStatus('fejl');
      setFejlTekst('Netværksfejl');
    }
  }

  if (status === 'ok') return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>TP-data hentet — opdaterer...</p>;
  if (status === 'fejl') return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>Fejl: {fejlTekst}</p>;

  return (
    <button
      onClick={hentTp}
      disabled={status === 'henter'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        fontSize: 'var(--text-xs)', padding: '0.3rem 0.6rem',
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
        borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-secondary)',
        marginTop: '0.5rem',
      }}
    >
      <RefreshCw size={11} style={{ animation: status === 'henter' ? 'spin 1s linear infinite' : undefined }} />
      {status === 'henter' ? 'Henter...' : 'Hent TP-data nu'}
    </button>
  );
}

export function BostedOrganisationKort({ bosted }: Props) {
  const adresse = bosted.tpAdresse ?? bosted.adresse ?? null;
  const pladserVærdi = bosted.tpPladsePrParagraf ?? bosted.tpPladser ?? bosted.pladser ?? null;
  const erTpMatchet = !!bosted.tpTilbudstype || !!bosted.tpPNummer;
  const pladserPlaceholder = erTpMatchet ? 'Ikke oplyst på Tilbudsportalen' : 'Mangler data';
  const kommune = bosted.tpKommune ?? bosted.kommune ?? null;

  const harKontakt = bosted.tpLeder || bosted.tpKontaktperson || bosted.tpTelefon || bosted.tpEmail;

  return (
    <>
      {/* Bostedinformation — TP-match kl. 02:00 */}
      <div className="bosted-detail-kort">
        <div className="bosted-detail-kort-header">
          <Building2 size={15} />
          <span className="bosted-detail-kort-titel">Bostedinformation</span>
        </div>
        <div className="bosted-detail-kort-body">
          <FeltRække label="CVR-nummer" value={bosted.cvr} />
          {bosted.cvrAntalAfdelinger != null && bosted.cvrAntalAfdelinger > 1 && (
            <FeltRække
              label="Afdelinger på CVR"
              value={`${bosted.cvrAntalAfdelinger} afdelinger registreret`}
            />
          )}
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
          <FeltRække label="Pladser" value={pladserVærdi} placeholder={pladserPlaceholder} />
          <FeltRække label="Tilbudstype" value={bosted.tpTilbudstype} />
          {bosted.tpVirksomhedsNavn && <FeltRække label="Virksomhed" value={bosted.tpVirksomhedsNavn} />}
          {!erTpMatchet && (
            <>
              <ScraperInfo kørselKl={2} scraperDato={bosted.scraperDato} label="TP-matcher" />
              {bosted.cvr && <HentTpKnap bostedId={bosted.id} cvr={bosted.cvr} />}
            </>
          )}
        </div>
      </div>

      {/* Kontakt — Synology TP-detaljer kl. 03:00 — vises altid */}
      <div className="bosted-detail-kort">
        <div className="bosted-detail-kort-header">
          <User size={15} />
          <span className="bosted-detail-kort-titel">Kontakt</span>
        </div>
        <div className="bosted-detail-kort-body">
          {harKontakt ? (
            <>
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
            </>
          ) : (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Ingen kontaktdata fundet endnu på Tilbudsportalen
            </p>
          )}
          {!harKontakt && (
            <ScraperInfo kørselKl={3} scraperDato={bosted.scraperDato} label="Synology TP-detaljer" />
          )}
        </div>
      </div>

      {/* Økonomi & virksomhed — CVR-ansatte kl. 03:00 */}
      {bosted.cvr && (
        <div className="bosted-detail-kort">
          <div className="bosted-detail-kort-header">
            <TrendingUp size={15} />
            <span className="bosted-detail-kort-titel">Økonomi &amp; virksomhed</span>
          </div>
          <div className="bosted-detail-kort-body">
            <FeltRække label="Antal ansatte" value={bosted.cvrAnsatte != null ? `${bosted.cvrAnsatte} ansatte` : null} placeholder="Ikke oplyst i CVR" />
            <FeltRække label="Virksomhedstype" value={bosted.cvrVirksomhedstype} placeholder="Ikke oplyst i CVR" />
            <FeltRække label="Branche" value={bosted.cvrBranche} placeholder="Ikke oplyst i CVR" />
            {bosted.cvrStiftet && (
              <FeltRække label="Stiftet" value={new Date(bosted.cvrStiftet).toLocaleDateString('da-DK', { year: 'numeric', month: 'long', day: 'numeric' })} />
            )}
            {bosted.cvrOpdateret && (
              <div className="bosted-detail-field">
                <span className="bosted-detail-field-label">CVR sidst hentet</span>
                <span className="bosted-detail-placeholder" style={{ fontStyle: 'normal', fontSize: '0.7rem' }}>
                  {new Date(bosted.cvrOpdateret).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            {bosted.cvrAnsatte == null && (
              <ScraperInfo kørselKl={3} scraperDato={bosted.scraperDato} label="CVR-ansatte" />
            )}
          </div>
        </div>
      )}

      {/* Tilsyn — Synology TP-detaljer kl. 03:00 — vises altid */}
      <div className="bosted-detail-kort">
        <div className="bosted-detail-kort-header">
          <Shield size={15} />
          <span className="bosted-detail-kort-titel">Tilsyn</span>
        </div>
        <div className="bosted-detail-kort-body">
          {bosted.tpTilsynsmyndighed ? (
            <FeltRække label="Tilsynsførende" value={bosted.tpTilsynsmyndighed} />
          ) : (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Ingen tilsynsdata fundet endnu på Tilbudsportalen
            </p>
          )}
          {!bosted.tpTilsynsmyndighed && (
            <ScraperInfo kørselKl={3} scraperDato={bosted.scraperDato} label="Synology TP-detaljer" />
          )}
        </div>
      </div>
    </>
  );
}
