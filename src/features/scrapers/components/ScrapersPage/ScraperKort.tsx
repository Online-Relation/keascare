// src/features/scrapers/components/ScrapersPage/ScraperKort.tsx

import { AlertTriangle, CheckCircle, Loader, Play, XCircle, RefreshCw } from 'lucide-react';
import type { ScraperStatus, Scraper } from './ScrapersPage';
import type { ScraperLog } from '@/lib/db/ScraperLog';

type Fremgang = {
  runder: number;
  totalBehandlet: number;
};

type ScraperKortProps = {
  scraper: Scraper;
  status: ScraperStatus;
  resultat?: Record<string, unknown>;
  fremgang?: Fremgang;
  log?: ScraperLog;
  onKør: () => void;
};

function formaterDato(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ScraperKort({ scraper, status, resultat, fremgang, log, onKør }: ScraperKortProps) {
  const kører = status === 'kører';

  return (
    <div className="scraper-kort">
      <div className="scraper-kort-header">
        <div className="scraper-kort-titel-række">
          <span className="scraper-kort-titel">{scraper.titel}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {scraper.loop && (
              <span className="scraper-loop-badge">
                <RefreshCw size={10} />
                Auto-loop
              </span>
            )}
            {status === 'kører' && <Loader size={16} className="scraper-ikon-kører" />}
            {status === 'done' && <CheckCircle size={16} color="var(--color-success, #16a34a)" />}
            {status === 'fejl' && <XCircle size={16} color="var(--color-danger, #dc2626)" />}
          </div>
        </div>
        <p className="scraper-kort-beskrivelse">{scraper.beskrivelse}</p>

        {scraper.advarsel && (
          <div className="scraper-kort-advarsel">
            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
            <span>{scraper.advarsel}</span>
          </div>
        )}
      </div>

      <div className="scraper-kort-footer">
        <button className="scraper-knap" onClick={onKør} disabled={kører}>
          <Play size={13} />
          {kører ? 'Kører...' : 'Kør nu'}
        </button>

        {log && !kører && status === 'idle' && (
          <div className={`scraper-log-status scraper-log-status--${log.ok ? 'ok' : 'fejl'}`}>
            {log.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
            <span>Senest kørt {formaterDato(log.kørtKl)}</span>
          </div>
        )}

        {kører && fremgang && fremgang.runder > 0 && (
          <div className="scraper-fremgang">
            <span>Runde {fremgang.runder}</span>
            <span>·</span>
            <span>{fremgang.totalBehandlet} behandlet</span>
          </div>
        )}

        {!kører && resultat && Object.keys(resultat).length > 0 && (
          <div className="scraper-resultat">
            {fremgang && fremgang.runder > 1 && (
              <div className="scraper-fremgang-total">
                {fremgang.runder} runder · {fremgang.totalBehandlet} behandlet i alt
              </div>
            )}
            <pre>{JSON.stringify(resultat, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
