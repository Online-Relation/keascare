'use client';

// src/features/dashboard/components/BostedDetailPage/sections/BostedTilsynKort/BostedTilsynKort.tsx

import { useState } from 'react';
import { ClipboardList, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import { beregnLeadVarme } from '@/features/rapporter/utils/LeadVarme';

function HentStpsDetaljerKnap({ bostedId }: { bostedId: string }) {
  const [status, setStatus] = useState<'idle' | 'henter' | 'ok' | 'fejl'>('idle');
  const [fejlTekst, setFejlTekst] = useState('');

  async function hent() {
    setStatus('henter');
    try {
      const res = await fetch('/api/scrapers/stps/berig-rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bostedId }),
      });
      const data = await res.json() as { ok: boolean; fejl?: string };
      if (data.ok) {
        setStatus('ok');
        setTimeout(() => window.location.reload(), 800);
      } else {
        setStatus('fejl');
        setFejlTekst(data.fejl ?? 'Ukendt fejl');
      }
    } catch {
      setStatus('fejl');
      setFejlTekst('Netværksfejl');
    }
  }

  if (status === 'ok') return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>Detaljer hentet — opdaterer...</p>;
  if (status === 'fejl') return <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{fejlTekst}</p>;

  return (
    <button
      onClick={hent}
      disabled={status === 'henter'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        fontSize: 'var(--text-xs)', padding: '0.3rem 0.6rem',
        background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
        borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-secondary)',
      }}
    >
      <RefreshCw size={11} style={{ animation: status === 'henter' ? 'spin 1s linear infinite' : undefined }} />
      {status === 'henter' ? 'Henter...' : 'Hent STPS detaljer nu'}
    </button>
  );
}

type BostedTilsynKortProps = {
  bosted: BostedDetail;
};

export function BostedTilsynKort({ bosted }: BostedTilsynKortProps) {
  const dato = bosted.rapportDato
    ? new Date(bosted.rapportDato).toLocaleDateString('da-DK', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  const besoegDato = bosted.besoegDato
    ? new Date(bosted.besoegDato).toLocaleDateString('da-DK', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const harFokus = bosted.fokusOmraader.length > 0;
  const harTemaer = bosted.temaer.length > 0;
  const varme = beregnLeadVarme(bosted.rapportDato);

  return (
    <div className="bosted-detail-kort">
      <div className="bosted-detail-kort-header">
        <ClipboardList size={15} />
        <span className="bosted-detail-kort-titel">STPS Tilsynsrapport</span>
      </div>

      <div className="bosted-detail-kort-body">
        {besoegDato && (
          <div className="bosted-detail-field">
            <span className="bosted-detail-field-label">Tilsynsbesøg</span>
            <span className="bosted-detail-field-value">{besoegDato}</span>
          </div>
        )}

        <div className="bosted-detail-field">
          <span className="bosted-detail-field-label">Rapportdato</span>
          <span className="bosted-detail-field-value">{dato}</span>
        </div>

        {(bosted.fundNiveau === 'kritisk' || bosted.fundNiveau === 'stoerre') && <div className="bosted-detail-field">
          <span className="bosted-detail-field-label">Lead-varme</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            {/* Gradient-slider med markør */}
            <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
              {/* Gradient-bar */}
              <div style={{
                width: '100%',
                height: '8px',
                borderRadius: '9999px',
                background: 'linear-gradient(to right, #16a34a, #eab308, #dc2626)',
              }} />
              {/* Markør */}
              {varme.dage >= 0 && (
                <div style={{
                  position: 'absolute',
                  left: `calc(${varme.markerPct}% - 7px)`,
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: `2.5px solid ${varme.farve}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                  pointerEvents: 'none',
                }} />
              )}
            </div>
            {/* Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
              <span style={{ color: '#16a34a' }}>Varmt</span>
              <span style={{ color: '#d97706' }}>Køler</span>
              <span style={{ color: '#dc2626' }}>Koldt</span>
            </div>
            {/* Status-tekst */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: varme.farve, flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: varme.farve, fontWeight: 'var(--fw-medium)' }}>{varme.label}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>— {varme.beskrivelse}</span>
            </div>
          </div>
        </div>}

        <div className="bosted-detail-field">
          <span className="bosted-detail-field-label">Tilsynsform</span>
          <span className="bosted-detail-field-value">{bosted.tilsynsform ?? '—'}</span>
        </div>

        {bosted.stpsKonklusion && (
          <div className="bosted-detail-field">
            <span className="bosted-detail-field-label">Konklusion / sanktioner</span>
            <span className="bosted-detail-field-value">{bosted.stpsKonklusion}</span>
          </div>
        )}

        {harTemaer && (
          <div className="bosted-detail-field">
            <span className="bosted-detail-field-label">Temaer</span>
            <div className="bosted-detail-tags" style={{ marginTop: '0.25rem' }}>
              {bosted.temaer.map((tema) => (
                <span key={tema} className="bosted-detail-tag">{tema}</span>
              ))}
            </div>
          </div>
        )}

        {harFokus && (
          <div className="bosted-detail-field">
            <span className="bosted-detail-field-label">Fokusområder</span>
            <div className="bosted-detail-tags" style={{ marginTop: '0.25rem' }}>
              {bosted.fokusOmraader.map((f) => (
                <span key={f} className="bosted-detail-tag" style={{ backgroundColor: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {!bosted.tilsynsform && !bosted.pdfUrl && (
          <HentStpsDetaljerKnap bostedId={bosted.id} />
        )}

        {(bosted.rapportUrl && !bosted.rapportUrl.startsWith('manuel:')) || bosted.pdfUrl ? (
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-light)' }}>
            {bosted.rapportUrl && !bosted.rapportUrl.startsWith('manuel:') && (
              <a
                href={bosted.rapportUrl}
                className="btn btn-outline btn-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={13} />
                Åbn rapport på STPS
              </a>
            )}
            {bosted.pdfUrl && (
              <a
                href={bosted.pdfUrl}
                className="btn btn-outline btn-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText size={13} />
                Åbn PDF
              </a>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
