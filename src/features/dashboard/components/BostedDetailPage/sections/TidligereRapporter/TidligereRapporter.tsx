'use client';

import { useEffect, useState } from 'react';
import { History, ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import type { AndenRapport } from '@/app/api/bosteder/andre-rapporter/route';

const FUND_FARVE: Record<string, string> = {
  'Kritiske fund':  '#dc2626',
  'Større fund':    '#d97706',
  'Mindre fund':    '#ca8a04',
  'Ingen fund':     '#16a34a',
};

type Props = {
  bostedId: string;
  cvr: string;
};

export function TidligereRapporter({ bostedId, cvr }: Props) {
  const [rapporter, setRapporter] = useState<AndenRapport[]>([]);
  const [åben, setÅben] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/bosteder/andre-rapporter?cvr=${cvr}&ekskluder=${bostedId}`)
      .then((r) => r.json())
      .then((d: AndenRapport[]) => setRapporter(d))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [bostedId, cvr]);

  if (!loaded || rapporter.length === 0) return null;

  return (
    <div className="bosted-detail-kort">
      <button
        className="bosted-detail-kort-header"
        onClick={() => setÅben((v) => !v)}
        style={{ width: '100%', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' }}
      >
        <History size={15} />
        <span className="bosted-detail-kort-titel">
          Tidligere STPS-rapporter ({rapporter.length})
        </span>
        {åben ? <ChevronUp size={15} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} /> : <ChevronDown size={15} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />}
      </button>

      {åben && (
        <div className="bosted-detail-kort-body" style={{ gap: '0.75rem' }}>
          {rapporter.map((r) => {
            const dato = r.rapportDato
              ? new Date(r.rapportDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—';
            const farve = r.fundNiveau ? FUND_FARVE[r.fundNiveau] ?? 'var(--color-text-muted)' : 'var(--color-text-muted)';

            return (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-primary)' }}>{dato}</span>
                  {r.tilsynsform && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{r.tilsynsform}</span>
                  )}
                  {r.fundNiveau && (
                    <span style={{ fontSize: 'var(--text-xs)', color: farve, fontWeight: 'var(--fw-medium)' }}>· {r.fundNiveau}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={r.rapportUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                    <ExternalLink size={12} /> Åbn rapport
                  </a>
                  {r.pdfUrl && (
                    <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                      <FileText size={12} /> PDF
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
