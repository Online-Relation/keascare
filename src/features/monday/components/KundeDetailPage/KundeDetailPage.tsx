'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

type Props = {
  mondayId: string;
  navn: string;
  gruppeNavn: string;
  forloebsansvarlig: string | null;
  oprettetDato: string | null;
  status: string | null;
};

const MONDAY_BOARD_URL = 'https://onlinerelation.monday.com/boards';

export function KundeDetailPage({ mondayId, navn, gruppeNavn, forloebsansvarlig, oprettetDato, status }: Props) {
  const router = useRouter();
  const [cvr, setCvr] = useState('');
  const [gemmer, setGemmer] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  async function handleLinkCvr() {
    const rensCvr = cvr.trim().replace(/\s/g, '');
    if (!/^\d{8}$/.test(rensCvr)) {
      setFejl('CVR skal være præcis 8 cifre');
      return;
    }

    setGemmer(true);
    setFejl(null);

    try {
      const res = await fetch(`/api/monday/kunder/${mondayId}/link-cvr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvr: rensCvr }),
      });
      const data = await res.json();

      if (!data.ok) {
        setFejl(data.fejl ?? 'Noget gik galt');
        return;
      }

      // Naviger til bostedets detailside og kør CVR-scraper bagefter
      router.push(`/dashboard/bosteder/${data.bostedId}?nyOprettet=1`);
    } catch {
      setFejl('Netværksfejl – prøv igen');
    } finally {
      setGemmer(false);
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
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Dette bosted er endnu ikke fundet i systemet. Indtast CVR-nummeret (find det på proff.dk eller cvr.dk) for at oprette forbindelsen.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={cvr}
            onChange={(e) => setCvr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLinkCvr()}
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
          <button
            onClick={handleLinkCvr}
            disabled={gemmer || cvr.trim().length === 0}
            className="btn btn-primary btn-sm"
          >
            {gemmer ? 'Henter…' : 'Link bosted'}
          </button>
        </div>
        {fejl && (
          <p style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-danger, #dc2626)' }}>{fejl}</p>
        )}
      </div>
    </div>
  );
}
