// src/features/scrapers/components/ScrapersPage/ScrapersPage.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { ScraperKort } from './ScraperKort';
import { ScraperHistorik } from './ScraperHistorik';
import { ScraperFremgang } from './ScraperFremgang';
import { MondayOversigt } from '@/features/monday/components/MondayOversigt';
import { ManuelMatch } from './ManuelMatch';
import { CvrOpslagPanel } from './CvrOpslagPanel';
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
    id: 'cvr-signaler',
    titel: 'CVR — Nye bosted-registreringer',
    beskrivelse: 'Søger i CVR-registret efter virksomheder med branchekode 87901/87902 der er startet de seneste 30 dage. Kræver CVR_USER + CVR_PASS fra distribution.virk.dk.',
    endpoint: '/api/scrapers/cvr-signaler',
    body: { dage: 30 },
    advarsel: 'Afventer adgang til distribution.virk.dk (Erhvervsstyrelsen).',
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
    id: 'cvr-ansatte',
    titel: 'CVR-register — Opdater ansatte og virksomhedsdata',
    beskrivelse: 'Henter antal ansatte, branche og virksomhedstype fra CVR for alle bosteder med CVR-nummer. Køres automatisk dagligt kl. 03:00 via cron. Prioriterer dem der er ældst opdateret.',
    endpoint: '/api/scrapers/cvr/ansatte',
    body: { batch: 40 },
    loop: true,
  },
  {
    id: 'tp-liste',
    titel: 'Tilbudsportalen — Hent tilbudsliste',
    beskrivelse: 'Henter alle §107/§108-tilbud fra Tilbudsportalen og gemmer navn og URL i databasen. Kører automatisk hver nat kl. 03:00 via Docker på Synology (hjemme-IP omgår Cloudflare). Knappen herunder virker ikke på Railway — brug Synology.',
    endpoint: '/api/scrapers/tilbudsportalen/liste',
    body: { maxSider: 50 },
    advarsel: 'Kører automatisk på Synology kl. 03:00. Knappen virker ikke på Railway pga. Cloudflare.',
  },
  {
    id: 'tp-detaljer',
    titel: 'Tilbudsportalen — Hent detaljer',
    beskrivelse: 'Henter CVR, tilbudstype, pladser, kommune og kontaktinfo for hvert tilbud. Behandler 200 ad gangen. Kører automatisk på Synology kl. 03:00 direkte efter liste-scraperens. Data nulstilles efter 30 dage så alt holdes opdateret.',
    endpoint: '/api/scrapers/tilbudsportalen/detaljer',
    body: { batch: 30 },
    loop: true,
    advarsel: 'Kører automatisk på Synology kl. 03:00. Knappen virker ikke på Railway pga. Cloudflare.',
  },
  {
    id: 'tp-match',
    titel: 'Tilbudsportalen — Kør matcher',
    beskrivelse: 'Matcher Tilbudsportalen-tilbud mod STPS-rapporter via CVR-nummer og navn. Sætter tilbudstype, pladser og kommune på STPS-bosteder. Kører automatisk på Railway kl. 05:00 via cron-job.org (efter Synology er færdig kl. 03:00) — kan også køres manuelt her.',
    endpoint: '/api/scrapers/tilbudsportalen/match',
    body: {},
  },
  {
    id: 'regnskab',
    titel: 'Regnskab — Hent årsregnskab',
    beskrivelse: 'Henter nøgletal fra Erhvervsstyrelsens årsrapport-API for bosteder med CVR. Kræver ingen credentials.',
    endpoint: '/api/scrapers/regnskab',
    body: { batch: 50 },
    loop: true,
  },
  {
    id: 'dst',
    titel: 'Danmarks Statistik — HAND01 borgere',
    beskrivelse: 'Henter antal borgere i §107/§108 botilbud pr. kommune fra DST og gemmer i Supabase-cache. Kører automatisk kvartalsvist d. 5. jan/apr/jul/okt. Kan køres manuelt her for at opdatere cachen med det.',
    endpoint: '/api/scrapers/dst',
    body: {},
  },
  {
    id: 'monday-match',
    titel: 'Monday — Synkroniser kunder',
    beskrivelse: 'Henter Bosted-kunder fra Monday (Nye + Aktive Forløb) og matcher mod STPS-bosteder på navn. Sætter "Kunde"-badge i dashboardet.',
    endpoint: '/api/scrapers/monday/match',
    body: {},
  },
];

type CvrStatus = { manglerCvr: number; manglerData: number; total: number };
type TpStatus = { total: number; mangler: number; matchet: number };

export function ScrapersPage() {
  const [statusser, setStatusser] = useState<Record<string, ScraperStatus>>({});
  const [resultater, setResultater] = useState<Record<string, Record<string, unknown>>>({});
  const [fremgang, setFremgang] = useState<Record<string, Fremgang>>({});
  const [logs, setLogs] = useState<Record<string, ScraperLog>>({});
  const [cvrStatus, setCvrStatus] = useState<CvrStatus | null>(null);
  const [tpStatus, setTpStatus] = useState<TpStatus | null>(null);

  function hentCvrStatus() {
    fetch('/api/scrapers/cvr/status')
      .then((r) => r.json())
      .then((d) => setCvrStatus(d))
      .catch(() => {});
  }

  function hentTpStatus() {
    fetch('/api/scrapers/tilbudsportalen/status')
      .then((r) => r.json())
      .then((d) => setTpStatus(d))
      .catch(() => {});
  }

  useEffect(() => {
    hentCvrStatus();
    hentTpStatus();
    fetch('/api/scrapers/logs')
      .then((r) => r.json())
      .then((data: ScraperLog[]) => {
        const map: Record<string, ScraperLog> = {};
        for (const log of data) map[log.scraperId] = log;
        setLogs(map);
      })
      .catch(() => {});
  }, []);

  async function rapporterLiveStatus(scraperId: string, status: string, progress: number, total: number) {
    try {
      await fetch('/api/scrapers/live-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scraper_id: scraperId, status, progress, total }),
      });
    } catch { /* ignore — live-status er ikke kritisk */ }
  }

  async function kørScraper(scraper: Scraper) {
    setStatusser((s) => ({ ...s, [scraper.id]: 'kører' }));
    setResultater((r) => ({ ...r, [scraper.id]: {} }));
    setFremgang((f) => ({ ...f, [scraper.id]: { runder: 0, totalBehandlet: 0 } }));

    await rapporterLiveStatus(scraper.id, 'kører', 0, 0);

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
        await rapporterLiveStatus(scraper.id, 'kører', totalBehandlet, 0);

        if (!data.ok) {
          await rapporterLiveStatus(scraper.id, 'fejl', totalBehandlet, 0);
          setStatusser((s) => ({ ...s, [scraper.id]: 'fejl' }));
          return;
        }

        if (!scraper.loop || behandletDenneRunde === 0) break;
      } while (true);

      await rapporterLiveStatus(scraper.id, 'idle', totalBehandlet, totalBehandlet);
      setStatusser((s) => ({ ...s, [scraper.id]: 'done' }));

      if (scraper.id === 'cvr-berig' || scraper.id === 'cvr-ansatte') hentCvrStatus();
      if (scraper.id === 'tp-liste' || scraper.id === 'tp-detaljer' || scraper.id === 'tp-match') hentTpStatus();

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
      await rapporterLiveStatus(scraper.id, 'fejl', totalBehandlet, 0);
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

      <ScraperFremgang />
      <ScraperHistorik />
      <MondayOversigt />
      <CvrOpslagPanel />

      <div className="scrapers-grid">
        {SCRAPERS.map((scraper) => {
          let badge: React.ReactNode = undefined;
          if (scraper.id === 'cvr-berig' && cvrStatus !== null) {
            badge = cvrStatus.manglerCvr > 0 ? (
              <span className="scraper-status-tæller scraper-status-tæller--advarsel">
                {cvrStatus.manglerCvr} mangler CVR-opslag
              </span>
            ) : (
              <span className="scraper-status-tæller scraper-status-tæller--ok">Alle CVR opslået ✓</span>
            );
          }
          if (scraper.id === 'cvr-ansatte' && cvrStatus !== null) {
            badge = cvrStatus.manglerData > 0 ? (
              <span className="scraper-status-tæller scraper-status-tæller--advarsel">
                {cvrStatus.manglerData} mangler ansatte/branche
              </span>
            ) : (
              <span className="scraper-status-tæller scraper-status-tæller--ok">Alle beriget ✓</span>
            );
          }
          if (scraper.id === 'tp-liste' && tpStatus !== null) {
            badge = tpStatus.total > 0 ? (
              <span className="scraper-status-tæller scraper-status-tæller--ok">
                {tpStatus.total} tilbud i databasen ✓
              </span>
            ) : (
              <span className="scraper-status-tæller scraper-status-tæller--advarsel">Ingen tilbud hentet endnu</span>
            );
          }
          if (scraper.id === 'tp-detaljer' && tpStatus !== null) {
            badge = tpStatus.mangler > 0 ? (
              <span className="scraper-status-tæller scraper-status-tæller--advarsel">
                {tpStatus.mangler} tilbud mangler detaljer
              </span>
            ) : (
              <span className="scraper-status-tæller scraper-status-tæller--ok">Alle detaljer hentet ✓</span>
            );
          }
          if (scraper.id === 'tp-match' && tpStatus !== null) {
            badge = tpStatus.matchet > 0 ? (
              <span className="scraper-status-tæller scraper-status-tæller--ok">
                {tpStatus.matchet} tilbud matchet mod STPS ✓
              </span>
            ) : (
              <span className="scraper-status-tæller scraper-status-tæller--advarsel">Ingen matches endnu</span>
            );
          }
          return (
            <ScraperKort
              key={scraper.id}
              scraper={scraper}
              status={statusser[scraper.id] ?? 'idle'}
              resultat={resultater[scraper.id]}
              fremgang={fremgang[scraper.id]}
              log={logs[scraper.id]}
              badge={badge}
              onKør={() => kørScraper(scraper)}
            />
          );
        })}
      </div>

      <ManuelMatch />
    </div>
  );
}
