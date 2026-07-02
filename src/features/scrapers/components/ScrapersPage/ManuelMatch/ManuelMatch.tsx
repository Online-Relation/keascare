'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import type { ManuelMatchKandidat } from '@/app/api/scrapers/tilbudsportalen/kandidater/route';

function fundBadgeCls(fund: string | null) {
  if (fund === 'kritisk') return 'badge-kritisk';
  if (fund === 'stoerre' || fund === 'større') return 'badge-større';
  if (fund === 'mindre') return 'badge-mindre';
  return 'badge-ingen';
}

function scoreFarve(score: number) {
  if (score >= 0.7) return 'var(--color-success, #16a34a)';
  if (score >= 0.5) return 'var(--color-primary)';
  return 'var(--color-text-muted)';
}

export function ManuelMatch() {
  const [kandidater, setKandidater] = useState<ManuelMatchKandidat[]>([]);
  const [loader, setLoader] = useState(true);
  const [udvidet, setUdvidet] = useState<number | null>(null);
  const [gemmer, setGemmer] = useState<string | null>(null);
  const [matchet, setMatchet] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/scrapers/tilbudsportalen/kandidater')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setKandidater(d); })
      .catch(() => {})
      .finally(() => setLoader(false));
  }, []);

  async function bekræftMatch(stpsId: number, tpId: number, tpNavn: string) {
    const nøgle = `${stpsId}-${tpId}`;
    setGemmer(nøgle);
    try {
      const res = await fetch('/api/scrapers/tilbudsportalen/manuel-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stpsId, tpId }),
      });
      if (res.ok) {
        setMatchet((m) => new Set([...m, stpsId]));
        setUdvidet(null);
      }
    } finally {
      setGemmer(null);
    }
    void tpNavn;
  }

  const synlige = kandidater.filter((k) => !matchet.has(k.stpsId));

  return (
    <div className="bosted-detail-kort" style={{ marginTop: '1.5rem' }}>
      <div className="bosted-detail-kort-header" style={{ cursor: 'default' }}>
        <span className="bosted-detail-kort-titel">Manuel Tilbudsportalen-match</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {loader ? '…' : `${synlige.length} umatchede med kandidater`}
        </span>
      </div>

      {loader && (
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          <Loader size={14} className="scraper-ikon-kører" />
          Analyserer umatchede bosteder…
        </div>
      )}

      {!loader && synlige.length === 0 && (
        <div style={{ padding: '1rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Ingen umatchede bosteder med kandidater fundet.
        </div>
      )}

      {!loader && synlige.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {synlige.map((k) => {
            const åben = udvidet === k.stpsId;
            const bedste = k.kandidater[0];
            return (
              <div key={k.stpsId} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <button
                  onClick={() => setUdvidet(åben ? null : k.stpsId)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {k.stpsNavn}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '0.1rem 0 0' }}>
                      {k.stpsKommune ?? '—'} · bedste match: <span style={{ color: scoreFarve(bedste.score) }}>{Math.round(bedste.score * 100)}%</span>
                    </p>
                  </div>
                  <span className={`badge ${fundBadgeCls(k.stpsFund)}`} style={{ flexShrink: 0, fontSize: '0.65rem' }}>
                    {k.stpsFund ?? 'ukendt'}
                  </span>
                  {åben ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {åben && (
                  <div style={{ padding: '0 1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {k.kandidater.map((kand) => {
                      const nøgle = `${k.stpsId}-${kand.tpId}`;
                      const erGemmer = gemmer === nøgle;
                      return (
                        <div key={kand.tpId} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                          padding: '0.5rem 0.75rem', borderRadius: '6px',
                          background: 'var(--color-bg-page)', border: '1px solid var(--color-border-light)',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-primary)', margin: 0 }}>
                              {kand.tpNavn}
                            </p>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '0.1rem 0 0' }}>
                              {kand.tpKommune ?? '—'}
                              {kand.tpAdresse ? ` · ${kand.tpAdresse}` : ''}
                              {kand.tpPladser ? ` · ${kand.tpPladser} pladser` : ''}
                            </p>
                            {(kand.tpTelefon || kand.tpEmail) && (
                              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '0.1rem 0 0' }}>
                                {kand.tpTelefon}{kand.tpEmail ? ` · ${kand.tpEmail}` : ''}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 'var(--fw-semibold)', color: scoreFarve(kand.score) }}>
                                {Math.round(kand.score * 100)}% navn
                              </span>
                              {kand.kommuneMatch
                                ? <span style={{ fontSize: '0.6rem', color: 'var(--color-success, #16a34a)', fontWeight: 'var(--fw-semibold)' }}>✓ samme kommune</span>
                                : <span style={{ fontSize: '0.6rem', color: 'var(--color-accent)' }}>⚠ anden kommune</span>
                              }
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                              onClick={() => bekræftMatch(k.stpsId, kand.tpId, kand.tpNavn)}
                              disabled={erGemmer}
                            >
                              {erGemmer ? <Loader size={11} className="scraper-ikon-kører" /> : <CheckCircle size={11} />}
                              Match
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                              onClick={() => setUdvidet(null)}
                              title="Spring over"
                            >
                              <XCircle size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
