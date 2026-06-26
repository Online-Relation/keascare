// src/features/scrapers/components/ScrapersPage/ScrapersPage.tsx

'use client';

import { useEffect, useState } from 'react';
import { ScraperKort } from './ScraperKort';
import { ScraperHistorik } from './ScraperHistorik';
import type { ScraperLog } from '@/lib/db/ScraperLog';

export type ScraperStatus = 'idle' | 'kører' | 'done' | 'fejl';

export type Scraper = {
  id: string;
  titel: string;
  beskrivelse: string;
  endpoint: string;
  body: Record<string, unknown>;
  advarsel?: string;
  loop?: boolean;
};

type Fremgang = {
  runder: number;
  totalBehandlet: number;
};

const SCRAPERS: Scraper[] = [
  {
    id: 'stps-liste',
    titel: 'STPS — Hent nye rapporter',
    beskrivelse: 'Henter rapportlisten fra stps.dk og gemmer nye i databasen.',
    endpoint: '/api/scrapers/stps',
    body: { maxSider: 10 },
  },
  {
    id: 'stps-detaljer',
    titel: "STPS — Parse PDF'er",
    beskrivelse: 'Behandler rapporter der mangler PDF-data (vurdering og fund).',
    endpoint: '/api/scrapers/stps/detaljer',
    body: { batch: 50 },
    loop: true,
  },
  {
    id: 'stps-fund-items',
    titel: 'STPS — Udtræk strukturerede fund-items',
    beskrivelse: 'Parser eksisterende PDFer og gemmer hvert målepunkt som struktureret data med status (opfyldt/ikke opfyldt/ikke aktuelt).',
    endpoint: '/api/scrapers/stps/fund-items',
    body: { batch: 30 },
    loop: true,
  },
  {
    id: 'stps-pnummer',
    titel: 'STPS — Udtræk P-numre fra PDFer',
    beskrivelse: 'Gennemgår eksisterende PDFer og udtrækker P-nummer for rapporter der mangler det.',
    endpoint: '/api/scrapers/stps/pnummer',
    body: { batch: 50 },
    loop: true,
  },
  {
    id: 'cvr-berig',
    titel: 'CVR-register — Berig med CVR og adresse',
    beskrivelse: 'Slår P-nummer op i CVR-registret for rapporter der mangler CVR. Henter CVR og adresse.',
    endpoint: '/api/scrapers/cvr',
    body: { batch: 50 },
    loop: true,
  },
  {
    id: 'tp-liste',
    titel: 'Tilbudsportalen — Hent tilbudsliste',
    beskrivelse: 'Henter alle voksne tilbud fra Tilbudsportalen og gemmer i databasen.',
    endpoint: '/api/scrapers/tilbudsportalen/liste',
    body: { maxSider: 50 },
    advarsel: 'Kan fejle på live-serveren pga. Cloudflare. Kør lokalt hvis det fejler.',
  },
  {
    id: 'tp-detaljer',
    titel: 'Tilbudsportalen — Hent detaljer og match',
    beskrivelse: 'Henter CVR, tilbudstype og pladser for hvert tilbud og matcher mod STPS-rapporter.',
    endpoint: '/api/scrapers/tilbudsportalen/detaljer',
    body: { batch: 30 },
    loop: true,
    advarsel: 'Kan fejle på live-serveren pga. Cloudflare. Kør lokalt hvis det fejler.',
  },
  {
    id: 'tp-match',
    titel: 'Tilbudsportalen — Kør matcher',
    beskrivelse: 'Matcher Tilbudsportalen-data mod STPS-rapporter via CVR og navn.',
    endpoint: '/api/scrapers/tilbudsportalen/match',
    body: {},
  },
];

export function ScrapersPage() {
  const [statusser, setStatusser] = useState<Record<string, ScraperStatus>>({});
  const [resultater, setResultater] = useState<Record<string, Record<string, unknown>>>({});
  const [fremgang, setFremgang] = useState<Record<string, Fremgang>>({});
  const [logs, setLogs] = useState<Record<string, ScraperLog>>({});

  useEffect(() => {
    fetch('/api/scrapers/logs')
      .then((r) => r.json())
      .then((data: ScraperLog[]) => {
        const map: Record<string, ScraperLog> = {};
        for (const log of data) map[log.scraperId] = log;
        setLogs(map);
      })
      .catch(() => {});
  }, []);

  async function kørScraper(scraper: Scraper) {
    setStatusser((s) => ({ ...s, [scraper.id]: 'kører' }));
    setResultater((r) => ({ ...r, [scraper.id]: {} }));
    setFremgang((f) => ({ ...f, [scraper.id]: { runder: 0, totalBehandlet: 0 } }));

    const secret = process.env.NEXT_PUBLIC_SCRAPER_SECRET;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['x-scraper-secret'] = secret;

    let runder = 0;
    let totalBehandlet = 0;

    try {
      do {
        const res = await fetch(scraper.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(scraper.body),
        });

        const data = (await res.json()) as Record<string, unknown>;
        runder++;
        const behandletDenneRunde = typeof data.behandlet === 'number' ? data.behandlet : 0;
        totalBehandlet += behandletDenneRunde;

        setResultater((r) => ({ ...r, [scraper.id]: data }));
        setFremgang((f) => ({ ...f, [scraper.id]: { runder, totalBehandlet } }));

        if (!data.ok) {
          setStatusser((s) => ({ ...s, [scraper.id]: 'fejl' }));
          return;
        }

        if (!scraper.loop || behandletDenneRunde === 0) break;
      } while (true);

      setStatusser((s) => ({ ...s, [scraper.id]: 'done' }));

      // Opdater log efter vellykket kørsel
      fetch('/api/scrapers/logs')
        .then((r) => r.json())
        .then((data: ScraperLog[]) => {
          const map: Record<string, ScraperLog> = {};
          for (const log of data) map[log.scraperId] = log;
          setLogs(map);
        })
        .catch(() => {});
    } catch (err) {
      setResultater((r) => ({ ...r, [scraper.id]: { ok: false, fejl: String(err) } }));
      setStatusser((s) => ({ ...s, [scraper.id]: 'fejl' }));
    }
  }

  return (
    <div className="scrapers-layout">
      <div className="scrapers-header">
        <h1 className="scrapers-titel">Scrapers</h1>
        <p className="scrapers-beskrivelse">
          Kør dataindsamling manuelt. STPS-scrapers virker altid. Tilbudsportalen kan kræve lokal
          kørsel.
        </p>
      </div>

      <ScraperHistorik />

      <div className="scrapers-grid">
        {SCRAPERS.map((scraper) => (
          <ScraperKort
            key={scraper.id}
            scraper={scraper}
            status={statusser[scraper.id] ?? 'idle'}
            resultat={resultater[scraper.id]}
            fremgang={fremgang[scraper.id]}
            log={logs[scraper.id]}
            onKør={() => kørScraper(scraper)}
          />
        ))}
      </div>
    </div>
  );
}
