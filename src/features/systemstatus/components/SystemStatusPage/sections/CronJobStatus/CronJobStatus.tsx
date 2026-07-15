'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

type LogEntry = {
  scraperId: string;
  ok: boolean;
  kørtKl: string;
  resultat: Record<string, unknown> | null;
};

const CRON_JOBS: { id: string; label: string }[] = [
  { id: 'stps-liste',      label: 'STPS — Hent nye rapporter' },
  { id: 'stps-detaljer',   label: 'STPS — Parse PDFer' },
  { id: 'stps-fund-items', label: 'STPS — Fund items' },
  { id: 'stps-pnummer',    label: 'STPS — P-numre fra PDFer' },
  { id: 'cvr-berig',       label: 'CVR — Berig med CVR og adresse' },
  { id: 'cvr-ansatte',     label: 'CVR — Ansatte og virksomhedsdata' },
  { id: 'tp-liste',        label: 'Tilbudsportalen — Hent liste' },
  { id: 'tp-detaljer',     label: 'Tilbudsportalen — Detaljer og match' },
];

function tidSiden(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const timer = Math.floor(diff / 1000 / 60 / 60);
  const min = Math.floor((diff / 1000 / 60) % 60);
  if (timer >= 24) return `${Math.floor(timer / 24)}d siden`;
  if (timer > 0) return `${timer}t ${min}m siden`;
  return `${min}m siden`;
}

export function CronJobStatus() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [indlæser, setIndlæser] = useState(true);

  useEffect(() => {
    fetch('/api/scrapers/logs')
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : (data.logs ?? []));
        setIndlæser(false);
      })
      .catch(() => setIndlæser(false));
  }, []);

  const logMap = new Map(logs.map((l) => [l.scraperId, l]));

  return (
    <div className="dashboard-kort" style={{ padding: '1.25rem' }}>
      {indlæser ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Indlæser…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {CRON_JOBS.map(({ id, label }) => {
            const log = logMap.get(id);
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>
                  {!log ? (
                    <Clock size={16} style={{ color: 'var(--color-text-muted)' }} />
                  ) : log.ok ? (
                    <CheckCircle size={16} style={{ color: 'var(--color-success, #16a34a)' }} />
                  ) : (
                    <XCircle size={16} style={{ color: 'var(--color-danger, #dc2626)' }} />
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>{label}</p>
                    {log && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {tidSiden(log.kørtKl)}
                      </p>
                    )}
                    {!log && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Aldrig kørt</p>
                    )}
                  </div>
                  {log && !log.ok && log.resultat?.error != null && (
                    <p style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-danger, #dc2626)',
                      marginTop: '0.2rem',
                      background: 'var(--color-danger-bg, #fef2f2)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      {String(log.resultat.error)}
                    </p>
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
