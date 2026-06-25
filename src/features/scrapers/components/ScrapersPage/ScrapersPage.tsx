// src/features/scrapers/components/ScrapersPage/ScrapersPage.tsx

'use client';

import { useState } from 'react';
import { ScraperKort } from './ScraperKort';

type ScraperStatus = 'idle' | 'kører' | 'done' | 'fejl';

type Resultat = Record<string, unknown>;

type Scraper = {
  id: string;
  titel: string;
  beskrivelse: string;
  endpoint: string;
  body: Record<string, unknown>;
  advarsel?: string;
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
    titel: 'STPS — Parse PDF\'er',
    beskrivelse: 'Behandler rapporter der mangler PDF-data (vurdering og fund).',
    endpoint: '/api/scrapers/stps/detaljer',
    body: { batch: 50 },
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
    advarsel: 'Kan fejle på live-serveren pga. Cloudflare. Kør lokalt hvis det fejler.',
  },
  {
    id: 'tp-match',
    titel: 'Tilbudsportalen — Kør matcher',
    beskrivelse: 'Matcher Tilbudsportalen-data mod STPS-rapporter via CVR og navn. Opdaterer tilbudstype og pladser.',
    endpoint: '/api/scrapers/tilbudsportalen/match',
    body: {},
  },
];

export function ScrapersPage() {
  const [statusser, setStatusser] = useState<Record<string, ScraperStatus>>({});
  const [resultater, setResultater] = useState<Record<string, Resultat>>({});

  async function kørScraper(scraper: Scraper) {
    setStatusser((s) => ({ ...s, [scraper.id]: 'kører' }));
    setResultater((r) => ({ ...r, [scraper.id]: {} }));

    try {
      const secret = process.env.NEXT_PUBLIC_SCRAPER_SECRET;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (secret) headers['x-scraper-secret'] = secret;

      const res = await fetch(scraper.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(scraper.body),
      });

      const data = await res.json() as Resultat;
      setResultater((r) => ({ ...r, [scraper.id]: data }));
      setStatusser((s) => ({ ...s, [scraper.id]: data.ok ? 'done' : 'fejl' }));
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
          Kør dataindsamling manuelt. STPS-scrapers virker altid. Tilbudsportalen kan kræve lokal kørsel.
        </p>
      </div>

      <div className="scrapers-grid">
        {SCRAPERS.map((scraper) => (
          <ScraperKort
            key={scraper.id}
            scraper={scraper}
            status={statusser[scraper.id] ?? 'idle'}
            resultat={resultater[scraper.id]}
            onKør={() => kørScraper(scraper)}
          />
        ))}
      </div>
    </div>
  );
}
