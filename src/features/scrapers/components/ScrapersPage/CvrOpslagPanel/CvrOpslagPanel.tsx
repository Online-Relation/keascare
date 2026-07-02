'use client';

import { useState } from 'react';
import { Search, Building2, FileText, CheckCircle, AlertTriangle, Loader, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { CvrOpslag } from '@/lib/api/CvrClient';

type StpsBosted = {
  id: string;
  stps_tilbud_navn: string | null;
  tp_adresse: string | null;
  adresse: string | null;
  kommune: string | null;
  tp_kommune: string | null;
  fund_niveau: string | null;
  rapport_dato: string | null;
  monday_item_id: string | null;
  p_nummer: string | null;
  cvr: string | null;
};

type OpslagResultat = {
  cvr: string;
  cvrData: CvrOpslag | null;
  cvrFejl: string | null;
  stpsBosteder: StpsBosted[];
  navnMatches: StpsBosted[];
};

function FeltRække({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null) return null;
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: 'var(--text-sm)', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <span style={{ color: 'var(--color-text-muted)', minWidth: '9rem', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--fw-medium)' }}>{value}</span>
    </div>
  );
}

export function CvrOpslagPanel() {
  const [cvrInput, setCvrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<OpslagResultat | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);
  const [opdaterer, setOpdaterer] = useState<string | null>(null);
  const [opdateretIds, setOpdateretIds] = useState<Set<string>>(new Set());

  const secret = process.env.NEXT_PUBLIC_SCRAPER_SECRET ?? '';

  async function søg() {
    const cvr = cvrInput.trim().replace(/\s/g, '');
    if (!/^\d{8}$/.test(cvr)) { setFejl('CVR skal være præcis 8 cifre'); return; }
    setFejl(null);
    setResultat(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/scrapers/cvr-opslag?cvr=${cvr}`);
      const data = await res.json();
      if (data.fejl) { setFejl(data.fejl); return; }
      setResultat(data);
    } catch {
      setFejl('Netværksfejl – prøv igen');
    } finally {
      setLoading(false);
    }
  }

  async function opdaterBosted(bosted: StpsBosted) {
    if (!resultat?.cvrData) return;
    setOpdaterer(bosted.id);
    try {
      const res = await fetch('/api/scrapers/cvr-opslag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-scraper-secret': secret },
        body: JSON.stringify({
          bostedId: bosted.id,
          cvr: resultat.cvr,
          adresse: resultat.cvrData.adresse,
          ansatte: resultat.cvrData.ansatte,
          branche: resultat.cvrData.branche,
          virksomhedstype: resultat.cvrData.virksomhedstype,
          stiftet: resultat.cvrData.stiftet,
        }),
      });
      if (res.ok) setOpdateretIds((s) => new Set([...s, bosted.id]));
    } finally {
      setOpdaterer(null);
    }
  }

  return (
    <div className="bosted-detail-kort" style={{ marginBottom: '1.25rem' }}>
      <div className="bosted-detail-kort-header">
        <Search size={15} />
        <span className="bosted-detail-kort-titel">CVR-opslag</span>
      </div>
      <div className="bosted-detail-kort-body">
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          Indtast et CVR-nummer for at se alle data vi har på tværs af CVR-registret og STPS — og opdater bosteder der mangler tilknytning.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="12345678"
            maxLength={8}
            value={cvrInput}
            onChange={(e) => setCvrInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && søg()}
            style={{
              flex: 1, padding: '0.45rem 0.75rem', fontSize: 'var(--text-sm)',
              border: '1px solid var(--color-border)', borderRadius: '0.5rem',
              background: 'var(--color-bg)', color: 'var(--color-text-primary)',
              fontFamily: 'monospace', letterSpacing: '0.08em',
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={søg} disabled={loading} style={{ gap: '0.35rem' }}>
            {loading ? <Loader size={14} className="scraper-ikon-kører" /> : <Search size={14} />}
            Slå op
          </button>
        </div>

        {fejl && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#dc2626', fontSize: 'var(--text-sm)', marginBottom: '0.75rem' }}>
            <AlertTriangle size={14} /> {fejl}
          </div>
        )}

        {resultat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* CVR-registerdata */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Building2 size={13} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CVR-register</span>
              </div>
              {resultat.cvrFejl ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#dc2626', fontSize: 'var(--text-sm)', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span><strong>Fejl fra CVR-registret:</strong> {resultat.cvrFejl}</span>
                </div>
              ) : resultat.cvrData ? (
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <FeltRække label="Navn" value={resultat.cvrData.navn} />
                  <FeltRække label="Adresse" value={resultat.cvrData.adresse} />
                  <FeltRække label="Ansatte" value={resultat.cvrData.ansatte != null ? `${resultat.cvrData.ansatte}` : null} />
                  <FeltRække label="Branche" value={resultat.cvrData.branche} />
                  <FeltRække label="Virksomhedstype" value={resultat.cvrData.virksomhedstype} />
                  <FeltRække label="Stiftet" value={resultat.cvrData.stiftet ? new Date(resultat.cvrData.stiftet).toLocaleDateString('da-DK') : null} />
                </div>
              ) : (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>CVR-nummer ikke fundet i registret</p>
              )}
            </div>

            {/* STPS-bosteder med dette CVR */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <FileText size={13} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  STPS-bosteder med dette CVR ({resultat.stpsBosteder.length})
                </span>
              </div>
              {resultat.stpsBosteder.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Ingen bosteder i systemet har dette CVR endnu</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {resultat.stpsBosteder.map((b) => (
                    <BostedKort key={b.id} bosted={b} cvrData={resultat.cvrData} opdateret={opdateretIds.has(b.id)} opdaterer={opdaterer === b.id} onOpdater={() => opdaterBosted(b)} />
                  ))}
                </div>
              )}
            </div>

            {/* Mulige navnematches uden CVR */}
            {resultat.navnMatches.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={13} style={{ color: '#d97706' }} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mulige matches uden CVR ({resultat.navnMatches.length})
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {resultat.navnMatches.map((b) => (
                    <BostedKort key={b.id} bosted={b} cvrData={resultat.cvrData} opdateret={opdateretIds.has(b.id)} opdaterer={opdaterer === b.id} onOpdater={() => opdaterBosted(b)} muligMatch />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

function BostedKort({ bosted, cvrData, opdateret, opdaterer, onOpdater, muligMatch }: {
  bosted: StpsBosted;
  cvrData: CvrOpslag | null;
  opdateret: boolean;
  opdaterer: boolean;
  onOpdater: () => void;
  muligMatch?: boolean;
}) {
  return (
    <div style={{
      background: muligMatch ? '#fffbeb' : 'var(--color-bg)',
      border: `1px solid ${muligMatch ? '#fde68a' : 'var(--color-border)'}`,
      borderRadius: '0.5rem', padding: '0.75rem',
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div>
          <Link href={`/dashboard/bosteder/${bosted.id}`} style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
            {bosted.stps_tilbud_navn ?? '—'}
          </Link>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {bosted.tp_kommune ?? bosted.kommune ?? '—'}
            {bosted.p_nummer && <> · P-nr: {bosted.p_nummer}</>}
            {bosted.cvr && <> · CVR: {bosted.cvr}</>}
          </div>
        </div>
        {opdateret ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--text-xs)', color: '#16a34a', whiteSpace: 'nowrap' }}>
            <CheckCircle size={13} /> Opdateret
          </span>
        ) : cvrData ? (
          <button className="btn btn-outline btn-sm" onClick={onOpdater} disabled={opdaterer} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            {opdaterer ? <Loader size={12} className="scraper-ikon-kører" /> : <RefreshCw size={12} />}
            {muligMatch ? 'Tilknyt CVR' : 'Opdater data'}
          </button>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {bosted.fund_niveau && (
          <span style={{ fontSize: 'var(--text-xs)', padding: '0.1rem 0.4rem', borderRadius: '9999px', background: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
            {bosted.fund_niveau}
          </span>
        )}
        {bosted.monday_item_id && (
          <span style={{ fontSize: 'var(--text-xs)', padding: '0.1rem 0.4rem', borderRadius: '9999px', background: '#dcfce7', color: '#15803d' }}>
            I Monday
          </span>
        )}
        {bosted.rapport_dato && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Rapport: {new Date(bosted.rapport_dato).toLocaleDateString('da-DK')}
          </span>
        )}
      </div>
    </div>
  );
}
