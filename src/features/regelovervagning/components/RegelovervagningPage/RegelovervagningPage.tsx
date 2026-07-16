'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import type { RegulatoryItem, RegelovervagningOverblik, ReviewStatus } from '@/features/regelovervagning/types/regulatory.types';
import { RegulatoryFundKort } from './sections/RegulatoryFundKort';

export function RegelovervagningPage() {
  const [overblik, setOverblik] = useState<RegelovervagningOverblik | null>(null);
  const [loader, setLoader] = useState(true);
  const [fejl, setFejl] = useState<string | null>(null);

  async function hent() {
    setLoader(true);
    try {
      const res = await fetch('/api/regelovervagning/overblik');
      const d = await res.json() as { ok: boolean; overblik?: RegelovervagningOverblik; fejl?: string };
      if (d.ok && d.overblik) setOverblik(d.overblik);
      else setFejl(d.fejl ?? 'Kunne ikke hente data');
    } catch {
      setFejl('Netværksfejl');
    } finally {
      setLoader(false);
    }
  }

  useEffect(() => { hent(); }, []);

  async function opdaterStatus(id: string, status: ReviewStatus) {
    await fetch(`/api/regelovervagning/items/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    hent();
  }

  const alleItems: RegulatoryItem[] = overblik
    ? [...overblik.senesteRetsinformation, ...overblik.senesteStps]
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    : [];

  return (
    <div className="kunder-layout">
      <div className="kunder-header">
        <ShieldCheck size={20} />
        <div>
          <h1 className="kunder-titel">Regelovervågning</h1>
          <p className="kunder-undertitel">Interne signaler fra Retsinformation og STPS — kun til faglig intern brug</p>
        </div>
      </div>

      {loader && <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Henter data…</p>}
      {fejl && <p style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)' }}>{fejl}</p>}

      {overblik && (
        <>
          {/* KPI-række */}
          <div className="regulatory-kpi-række">
            <div className="regulatory-kpi">
              <span className="regulatory-kpi-tal">{overblik.nySidenSidsteImport}</span>
              <span className="regulatory-kpi-label">Nye siden sidst</span>
            </div>
            <div className="regulatory-kpi">
              <span className="regulatory-kpi-tal regulatory-kpi-tal--høj">{overblik.højRelevans}</span>
              <span className="regulatory-kpi-label">Høj relevans</span>
            </div>
            {overblik.senesteImport.map((imp) => (
              <div key={imp.source} className="regulatory-kpi">
                <span className={`regulatory-import-status ${imp.ok ? 'ok' : 'fejl'}`}>
                  {imp.ok ? '✓' : '✗'} {imp.source === 'retsinformation' ? 'Retsinformation' : 'STPS'}
                </span>
                <span className="regulatory-kpi-label">
                  {imp.kørtKl ? new Date(imp.kørtKl).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' }) : 'Aldrig kørt'}
                </span>
              </div>
            ))}
          </div>

          {/* Emnefordeling */}
          {overblik.emneFordeling.length > 0 && (
            <div className="bosted-detail-kort">
              <div className="bosted-detail-kort-header">
                <span className="bosted-detail-kort-titel">Emnefordeling</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                {overblik.emneFordeling.map(({ emne, antal }) => (
                  <span key={emne} className="badge badge-topic">
                    {emne} ({antal})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Seneste fund */}
          {alleItems.length === 0 ? (
            <div className="bosted-detail-kort" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Ingen fund endnu. Kør import via Scrapers-siden eller vent på næste daglige cron.
              </p>
            </div>
          ) : (
            <div className="bosted-detail-kort">
              <div className="bosted-detail-kort-header">
                <span className="bosted-detail-kort-titel">Seneste fund ({alleItems.length})</span>
                <button className="btn btn-ghost btn-sm" onClick={hent}>
                  <RefreshCw size={13} /> Opdater
                </button>
              </div>
              <div className="regulatory-liste">
                {alleItems.map((item) => (
                  <RegulatoryFundKort key={item.id} item={item} onStatusSkift={opdaterStatus} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
