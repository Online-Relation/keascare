'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

type Props = {
  mondayId: string;
  navn: string;
  gruppeNavn: string;
  forloebsansvarlig: string | null;
  oprettetDato: string | null;
  status: string | null;
  adresse: string | null;
};

type CvrOpslag = { navn: string; adresse: string | null };

type Fase = 'input' | 'bekræft' | 'henter' | 'færdig';

const MONDAY_BOARD_URL = 'https://onlinerelation.monday.com/boards';

export function KundeDetailPage({ mondayId, navn, gruppeNavn, forloebsansvarlig, oprettetDato, status, adresse }: Props) {
  const [cvr, setCvr] = useState('');
  const [fase, setFase] = useState<Fase>('input');
  const [cvrOpslag, setCvrOpslag] = useState<CvrOpslag | null>(null);
  const [statusTekst, setStatusTekst] = useState('');
  const [fejl, setFejl] = useState<string | null>(null);

  async function handleSlåOpCvr() {
    const rensCvr = cvr.trim().replace(/\s/g, '');
    if (!/^\d{8}$/.test(rensCvr)) {
      setFejl('CVR skal være præcis 8 cifre');
      return;
    }
    setFejl(null);
    setFase('henter');
    setStatusTekst('Slår CVR op…');

    try {
      const res = await fetch(`/api/scrapers/cvr-opslag?cvr=${rensCvr}`);
      const data = await res.json();

      if (!data.cvrData && !data.cvrFejl) {
        setFejl('CVR-nummeret blev ikke fundet i registeret. Tjek at du har tastet korrekt.');
        setFase('input');
        return;
      }

      if (data.cvrFejl && !data.cvrData) {
        setFejl(`Kunne ikke slå CVR op: ${data.cvrFejl}`);
        setFase('input');
        return;
      }

      setCvrOpslag({ navn: data.cvrData.navn, adresse: data.cvrData.adresse });
      setFase('bekræft');
    } catch {
      setFejl('Netværksfejl – prøv igen');
      setFase('input');
    }
  }

  async function handleBekræft() {
    const rensCvr = cvr.trim().replace(/\s/g, '');
    setFase('henter');
    setFejl(null);

    try {
      // 1. Link CVR til Monday-kunden
      setStatusTekst('Opretter bosted…');
      const linkRes = await fetch(`/api/monday/kunder/${mondayId}/link-cvr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvr: rensCvr }),
      });
      const linkData = await linkRes.json();
      if (!linkData.ok) {
        setFejl(linkData.fejl ?? 'Oprettelse fejlede');
        setFase('bekræft');
        return;
      }

      const bostedId = linkData.bostedId;

      // 2. Berig med CVR, regnskab og STPS — klient-side så det ikke afbrydes
      setStatusTekst('Henter CVR-data og regnskab…');
      await fetch('/api/scrapers/berig-bosted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bostedId, cvr: rensCvr }),
      });

      setStatusTekst('Færdig! Sender dig videre…');
      setFase('færdig');

      // Naviger til bosted-siden
      window.location.href = `/dashboard/bosteder/${bostedId}`;
    } catch {
      setFejl('Netværksfejl – prøv igen');
      setFase('bekræft');
    }
  }

  const mondayUrl = `${MONDAY_BOARD_URL}/${process.env.NEXT_PUBLIC_MONDAY_BOARD_ID}/pulses/${mondayId}`;

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)', margin: 0 }}>{navn}</h1>
          <a href={mondayUrl} target="_blank" rel="noopener noreferrer" title="Åbn i Monday" style={{ color: 'var(--color-text-muted)' }}>
            <ExternalLink size={15} />
          </a>
        </div>
        <span className="badge badge-info">{gruppeNavn}</span>
      </div>

      {/* Monday-info */}
      <div className="dashboard-kort" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: '1rem' }}>Monday CRM</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Forløbsansvarlig', værdi: forloebsansvarlig ?? '—' },
            { label: 'Status', værdi: status ?? '—' },
            { label: 'Oprettet', værdi: oprettetDato ? new Date(oprettetDato).toLocaleDateString('da-DK') : '—' },
          ].map((r) => (
            <div key={r.label}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>{r.label}</p>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>{r.værdi}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CVR-link */}
      <div className="dashboard-kort" style={{ padding: '1.25rem' }}>
        <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: '0.5rem' }}>Link til bosted</p>

        {fase === 'input' && (
          <>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Indtast CVR-nummeret (find det på proff.dk eller cvr.dk). Vi slår det op og bekræfter firmanavnet før vi linker.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={cvr}
                onChange={(e) => { setCvr(e.target.value); setFejl(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSlåOpCvr()}
                placeholder="12345678"
                maxLength={8}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                }}
              />
              <button onClick={handleSlåOpCvr} disabled={cvr.trim().length < 8} className="btn btn-primary btn-sm">
                Slå op
              </button>
            </div>
            {fejl && (
              <p style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-danger, #dc2626)' }}>{fejl}</p>
            )}
          </>
        )}

        {fase === 'bekræft' && cvrOpslag && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
              }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>CVR-registeret</p>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }}>{cvrOpslag.navn}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>CVR: {cvr.trim()}</p>
                {cvrOpslag.adresse && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{cvrOpslag.adresse}</p>
                )}
              </div>
              <div style={{
                background: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
              }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Monday CRM</p>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }}>{navn}</p>
                {adresse ? (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{adresse}</p>
                ) : (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>Ingen adresse i Monday</p>
                )}
              </div>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>
              Passer disse to sammen?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { setFase('input'); setCvrOpslag(null); }} className="btn btn-ghost btn-sm">
                Nej, ret CVR
              </button>
              <button onClick={handleBekræft} className="btn btn-primary btn-sm">
                Ja, link bosted
              </button>
            </div>
            {fejl && (
              <p style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-danger, #dc2626)' }}>{fejl}</p>
            )}
          </>
        )}

        {(fase === 'henter' || fase === 'færdig') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: '2px solid var(--color-primary)',
              borderTopColor: 'transparent',
              animation: fase === 'henter' ? 'spin 0.8s linear infinite' : 'none',
              background: fase === 'færdig' ? 'var(--color-primary)' : 'transparent',
            }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{statusTekst}</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
