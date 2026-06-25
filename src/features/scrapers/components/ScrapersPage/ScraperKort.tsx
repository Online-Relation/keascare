// src/features/scrapers/components/ScrapersPage/ScraperKort.tsx

import { AlertTriangle, CheckCircle, Loader, Play, XCircle } from 'lucide-react';

type ScraperStatus = 'idle' | 'kører' | 'done' | 'fejl';

type Scraper = {
  id: string;
  titel: string;
  beskrivelse: string;
  advarsel?: string;
};

type ScraperKortProps = {
  scraper: Scraper;
  status: ScraperStatus;
  resultat?: Record<string, unknown>;
  onKør: () => void;
};

const statusIkon = {
  idle: null,
  kører: <Loader size={16} className="scraper-ikon-kører" />,
  done: <CheckCircle size={16} color="var(--color-success, #16a34a)" />,
  fejl: <XCircle size={16} color="var(--color-danger, #dc2626)" />,
};

export function ScraperKort({ scraper, status, resultat, onKør }: ScraperKortProps) {
  return (
    <div className="scraper-kort">
      <div className="scraper-kort-header">
        <div className="scraper-kort-titel-række">
          <span className="scraper-kort-titel">{scraper.titel}</span>
          {statusIkon[status]}
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
        <button
          className="scraper-knap"
          onClick={onKør}
          disabled={status === 'kører'}
        >
          <Play size={13} />
          {status === 'kører' ? 'Kører...' : 'Kør nu'}
        </button>

        {resultat && Object.keys(resultat).length > 0 && (
          <div className="scraper-resultat">
            <pre>{JSON.stringify(resultat, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
