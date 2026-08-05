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

export type KørselKilde = 'railway' | 'synology' | 'cronjobs' | 'lokal' | 'manuel';

export type Scraper = {
  id: string;
  titel: string;
  beskrivelse: string;
  endpoint: string;
  body: Record<string, unknown>;
  advarsel?: string;
  loop?: boolean;
  kategori: string;
  kørselKilde: KørselKilde;
  cronTidspunkt?: string;
};

type Fremgang = { runder: number; totalBehandlet: number };
type CvrStatus = { manglerCvr: number; manglerData: number; total: number };
type TpStatus  = { total: number; mangler: number; matchet: number };
type LosStatus = { total: number; manglerDetaljer: number; matchet: number };

const SCRAPERS: Scraper[] = [
  // ── STPS ──────────────────────────────────────────────────────
  {
    id: 'stps-liste',
    kategori: 'STPS — Tilsynsrapporter',
    kørselKilde: 'railway',
    cronTidspunkt: 'Dagligt kl. 20:00',
    titel: 'STPS — Hent nye rapporter',
    beskrivelse: 'Henter rapportlisten fra stps.dk og gemmer nye i databasen.',
    endpoint: '/api/scrapers/stps',
    body: { maxSider: 10 },
  },
  {
    id: 'stps-detaljer',
    kategori: 'STPS — Tilsynsrapporter',
    kørselKilde: 'railway',
    cronTidspunkt: 'Dagligt kl. 20:04',
    titel: "STPS — Parse PDF'er",
    beskrivelse: 'Behandler rapporter der mangler PDF-data (vurdering og fund).',
    endpoint: '/api/scrapers/stps/detaljer',
    body: { batch: 50 },
    loop: true,
  },
  {
    id: 'stps-fund-items',
    kategori: 'STPS — Tilsynsrapporter',
    kørselKilde: 'railway',
    cronTidspunkt: 'Dagligt kl. 20:04',
    titel: 'STPS — Udtræk strukturerede fund-items',
    beskrivelse: 'Parser eksisterende PDFer og gemmer hvert målepunkt som struktureret data med status (opfyldt/ikke opfyldt/ikke aktuelt).',
    endpoint: '/api/scrapers/stps/fund-items',
    body: { batch: 30 },
    loop: true,
  },
  {
    id: 'stps-pnummer',
    kategori: 'STPS — Tilsynsrapporter',
    kørselKilde: 'railway',
    cronTidspunkt: 'Dagligt kl. 20:04',
    titel: 'STPS — Udtræk P-numre fra PDFer',
    beskrivelse: 'Gennemgår eksisterende PDFer og udtrækker P-nummer for rapporter der mangler det.',
    endpoint: '/api/scrapers/stps/pnummer',
    body: { batch: 50 },
    loop: true,
  },

  // ── Tilbudsportalen ───────────────────────────────────────────
  {
    id: 'tp-liste',
    kategori: 'Tilbudsportalen',
    kørselKilde: 'synology',
    cronTidspunkt: 'Dagligt kl. 03:00',
    titel: 'Tilbudsportalen — Hent tilbudsliste',
    beskrivelse: 'Henter alle §107/§108-tilbud fra Tilbudsportalen og gemmer navn og URL i databasen. Kører automatisk via Docker på Synology — hjemme-IP omgår Cloudflare.',
    endpoint: '/api/scrapers/tilbudsportalen/liste',
    body: { maxSider: 50 },
    advarsel: 'Kører automatisk på Synology kl. 03:00. Knappen virker ikke fra Railway pga. Cloudflare.',
  },
  {
    id: 'tp-detaljer',
    kategori: 'Tilbudsportalen',
    kørselKilde: 'synology',
    cronTidspunkt: 'Dagligt kl. 03:00',
    titel: 'Tilbudsportalen — Hent detaljer',
    beskrivelse: 'Henter CVR, tilbudstype, pladser, kommune og kontaktinfo for hvert tilbud. Behandler 200 ad gangen. Data nulstilles efter 30 dage så alt holdes opdateret.',
    endpoint: '/api/scrapers/tilbudsportalen/detaljer',
    body: { batch: 30 },
    loop: true,
    advarsel: 'Kører automatisk på Synology kl. 03:00. Knappen virker ikke fra Railway pga. Cloudflare.',
  },
  {
    id: 'tp-match',
    kategori: 'Tilbudsportalen',
    kørselKilde: 'cronjobs',
    cronTidspunkt: 'Dagligt kl. 05:00',
    titel: 'Tilbudsportalen — Kør matcher',
    beskrivelse: 'Matcher Tilbudsportalen-tilbud mod STPS-rapporter via CVR-nummer og navn. Sætter tilbudstype, pladser og kommune på STPS-bosteder.',
    endpoint: '/api/scrapers/tilbudsportalen/match',
    body: {},
  },

  // ── CVR-register ──────────────────────────────────────────────
  {
    id: 'cvr-berig',
    kategori: 'CVR-register',
    kørselKilde: 'manuel',
    titel: 'CVR — Berig med CVR og adresse',
    beskrivelse: 'Slår P-nummer op i CVR-registret for rapporter der mangler CVR. Henter CVR og adresse.',
    endpoint: '/api/scrapers/cvr',
    body: { batch: 50 },
    loop: true,
  },
  {
    id: 'cvr-ansatte',
    kategori: 'CVR-register',
    kørselKilde: 'cronjobs',
    cronTidspunkt: 'Dagligt kl. 03:00',
    titel: 'CVR — Opdater ansatte og virksomhedsdata',
    beskrivelse: 'Henter antal ansatte, branche og virksomhedstype fra CVR for alle bosteder med CVR-nummer. Prioriterer dem der er ældst opdateret.',
    endpoint: '/api/scrapers/cvr/ansatte',
    body: { batch: 40 },
    loop: true,
  },
  {
    id: 'regnskab',
    kategori: 'CVR-register',
    kørselKilde: 'synology',
    cronTidspunkt: 'Manuel fra Synology',
    titel: 'CVR — Hent årsregnskab',
    beskrivelse: 'Henter nøgletal fra Erhvervsstyrelsens årsrapport-API (regnskab.virk.dk). Railway kan ikke nå domænet — kør fra Synology eller lokalt.',
    endpoint: '/api/scrapers/regnskab',
    body: { batch: 50 },
    loop: true,
    advarsel: 'regnskab.virk.dk er DNS-blokeret på Railway. Kør fra Synology eller lokalt — samme situation som Tilbudsportalen.',
  },
  {
    id: 'cvr-signaler',
    kategori: 'CVR-register',
    kørselKilde: 'manuel',
    titel: 'CVR — Nye bosted-registreringer',
    beskrivelse: 'Søger i CVR-registret efter virksomheder med branchekode 87901/87902 der er startet de seneste 30 dage.',
    endpoint: '/api/scrapers/cvr-signaler',
    body: { dage: 30 },
    advarsel: 'Afventer adgang til distribution.virk.dk (Erhvervsstyrelsen).',
  },

  // ── LOS ───────────────────────────────────────────────────────
  {
    id: 'los-liste',
    kategori: 'LOS — Landsorganisationen',
    kørselKilde: 'railway',
    cronTidspunkt: 'Manuel',
    titel: 'LOS — Hent medlemsliste',
    beskrivelse: 'Henter alle §43, §107 og §108-medlemmer fra Landsorganisationen for sociale tilbud (los.dk). Kører direkte fra Railway — los.dk har ingen Cloudflare-spærring.',
    endpoint: '/api/scrapers/los',
    body: { trin: 'liste' },
  },
  {
    id: 'los-detaljer',
    kategori: 'LOS — Landsorganisationen',
    kørselKilde: 'railway',
    cronTidspunkt: 'Manuel',
    titel: 'LOS — Hent detaljer',
    beskrivelse: 'Henter CVR, kontakt, adresse og accordion-data (ydelser, pladser, priser, ledelse) for hvert LOS-medlem der mangler detaljer.',
    endpoint: '/api/scrapers/los',
    body: { trin: 'detaljer', max: 100 },
    loop: true,
  },
  {
    id: 'los-match',
    kategori: 'LOS — Landsorganisationen',
    kørselKilde: 'railway',
    cronTidspunkt: 'Manuel',
    titel: 'LOS — Match mod bosteder',
    beskrivelse: 'Matcher LOS-medlemmer mod STPS-bosteder via CVR-nummer og sætter LOS-medl-badge på matchede bosteder.',
    endpoint: '/api/scrapers/los',
    body: { trin: 'match' },
  },

  // ── Monday CRM ────────────────────────────────────────────────
  {
    id: 'monday-match',
    kategori: 'Monday CRM',
    kørselKilde: 'manuel',
    titel: 'Monday — Synkroniser kunder',
    beskrivelse: 'Henter Bosted-kunder fra Monday (Nye + Aktive Forløb) og matcher mod STPS-bosteder på navn. Sætter "Kunde"-badge i dashboardet.',
    endpoint: '/api/scrapers/monday/match',
    body: {},
  },

  // ── Geodata & Register ────────────────────────────────────────
  {
    id: 'geocoder',
    kategori: 'Geodata & Register',
    kørselKilde: 'manuel',
    titel: 'Geocoder — Koordinater via DAWA',
    beskrivelse: 'Slår adresser op i Danmarks Adressers Web API og gemmer lat/lng koordinater til kortvisning. Kør indtil alle bosteder er geocodet.',
    endpoint: '/api/scrapers/geocoder',
    body: { batch: 50 },
  },
  {
    id: 'sor-sync',
    kategori: 'Geodata & Register',
    kørselKilde: 'manuel',
    titel: 'SOR — Synkroniser organisationsregister',
    beskrivelse: "Henter alle enheder fra NSI's SOR API og gemmer i Supabase-cache. Bruges til SOR-badge på kunder og nye potentielle leads under SOR Register.",
    endpoint: '/api/sor/sync',
    body: {},
  },
  {
    id: 'dst',
    kategori: 'Geodata & Register',
    kørselKilde: 'cronjobs',
    cronTidspunkt: 'Kvartalsvist — 5. jan/apr/jul/okt',
    titel: 'Danmarks Statistik — HAND01 borgere',
    beskrivelse: 'Henter antal borgere i §107/§108 botilbud pr. kommune fra DST og gemmer i Supabase-cache. Kan køres manuelt for at opdatere cachen.',
    endpoint: '/api/scrapers/dst',
    body: {},
  },

  // ── Regelovervågning ─────────────────────────────────────────
  {
    id: 'stps-nyheder',
    kategori: 'Regelovervågning',
    kørselKilde: 'railway',
    cronTidspunkt: 'Manuel',
    titel: 'Regelovervågning — STPS-nyheder',
    beskrivelse: 'Scraper nye nyheder og OBS-meddelelser fra stps.dk og vurderer relevans for botilbud.',
    endpoint: '/api/scrapers/regelovervagning',
    body: { kilder: ['stps'] },
  },
  {
    id: 'retsinformation',
    kategori: 'Regelovervågning',
    kørselKilde: 'lokal',
    titel: 'Regelovervågning — Retsinformation',
    beskrivelse: 'Henter nye love, bekendtgørelser og vejledninger fra Retsinformation der er relevante for botilbud.',
    endpoint: '/api/scrapers/regelovervagning',
    body: { kilder: ['retsinformation'] },
    advarsel: 'data.retsinformation.dk er blokeret fra Railway. Kør fra Synology eller lokalt.',
  },
];

// Rækkefølge for kategorierne
const KATEGORI_ORDEN = [
  'STPS — Tilsynsrapporter',
  'Tilbudsportalen',
  'CVR-register',
  'LOS — Landsorganisationen',
  'Monday CRM',
  'Geodata & Register',
  'Regelovervågning',
];

export function ScrapersPage() {
  const [statusser, setStatusser] = useState<Record<string, ScraperStatus>>({});
  const [resultater, setResultater] = useState<Record<string, Record<string, unknown>>>({});
  const [fremgang, setFremgang] = useState<Record<string, Fremgang>>({});
  const [logs, setLogs] = useState<Record<string, ScraperLog>>({});
  const [cvrStatus, setCvrStatus] = useState<CvrStatus | null>(null);
  const [tpStatus, setTpStatus] = useState<TpStatus | null>(null);
  const [losStatus, setLosStatus] = useState<LosStatus | null>(null);

  function hentCvrStatus() {
    fetch('/api/scrapers/cvr/status').then((r) => r.json()).then((d) => setCvrStatus(d)).catch(() => {});
  }
  function hentTpStatus() {
    fetch('/api/scrapers/tilbudsportalen/status').then((r) => r.json()).then((d) => setTpStatus(d)).catch(() => {});
  }
  function hentLosStatus() {
    fetch('/api/scrapers/los/status').then((r) => r.json()).then((d) => setLosStatus(d)).catch(() => {});
  }

  useEffect(() => {
    hentCvrStatus();
    hentTpStatus();
    hentLosStatus();
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
    } catch { /* ignore */ }
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
      if (['tp-liste', 'tp-detaljer', 'tp-match'].includes(scraper.id)) hentTpStatus();
      if (['los-liste', 'los-detaljer', 'los-match'].includes(scraper.id)) hentLosStatus();

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

  function getBadge(scraper: Scraper): React.ReactNode {
    if (scraper.id === 'cvr-berig' && cvrStatus !== null) {
      return cvrStatus.manglerCvr > 0
        ? <span className="scraper-status-tæller scraper-status-tæller--advarsel">{cvrStatus.manglerCvr} mangler CVR-opslag</span>
        : <span className="scraper-status-tæller scraper-status-tæller--ok">Alle CVR opslået ✓</span>;
    }
    if (scraper.id === 'cvr-ansatte' && cvrStatus !== null) {
      return cvrStatus.manglerData > 0
        ? <span className="scraper-status-tæller scraper-status-tæller--advarsel">{cvrStatus.manglerData} mangler ansatte/branche</span>
        : <span className="scraper-status-tæller scraper-status-tæller--ok">Alle beriget ✓</span>;
    }
    if (scraper.id === 'tp-liste' && tpStatus !== null) {
      return tpStatus.total > 0
        ? <span className="scraper-status-tæller scraper-status-tæller--ok">{tpStatus.total} tilbud i databasen ✓</span>
        : <span className="scraper-status-tæller scraper-status-tæller--advarsel">Ingen tilbud hentet endnu</span>;
    }
    if (scraper.id === 'tp-detaljer' && tpStatus !== null) {
      return tpStatus.mangler > 0
        ? <span className="scraper-status-tæller scraper-status-tæller--advarsel">{tpStatus.mangler} tilbud mangler detaljer</span>
        : <span className="scraper-status-tæller scraper-status-tæller--ok">Alle detaljer hentet ✓</span>;
    }
    if (scraper.id === 'tp-match' && tpStatus !== null) {
      return tpStatus.matchet > 0
        ? <span className="scraper-status-tæller scraper-status-tæller--ok">{tpStatus.matchet} tilbud matchet mod STPS ✓</span>
        : <span className="scraper-status-tæller scraper-status-tæller--advarsel">Ingen matches endnu</span>;
    }
    if (scraper.id === 'los-liste' && losStatus !== null) {
      return losStatus.total > 0
        ? <span className="scraper-status-tæller scraper-status-tæller--ok">{losStatus.total} LOS-medlemmer i databasen ✓</span>
        : <span className="scraper-status-tæller scraper-status-tæller--advarsel">Ingen LOS-medlemmer hentet endnu</span>;
    }
    if (scraper.id === 'los-detaljer' && losStatus !== null) {
      return losStatus.manglerDetaljer > 0
        ? <span className="scraper-status-tæller scraper-status-tæller--advarsel">{losStatus.manglerDetaljer} mangler detaljer</span>
        : <span className="scraper-status-tæller scraper-status-tæller--ok">Alle detaljer hentet ✓</span>;
    }
    if (scraper.id === 'los-match' && losStatus !== null) {
      return losStatus.matchet > 0
        ? <span className="scraper-status-tæller scraper-status-tæller--ok">{losStatus.matchet} bosteder matchet ✓</span>
        : <span className="scraper-status-tæller scraper-status-tæller--advarsel">Ingen matches endnu</span>;
    }
    return undefined;
  }

  // Gruppér scrapers efter kategori i fast rækkefølge
  const kategorier = KATEGORI_ORDEN.map((navn) => ({
    navn,
    scrapers: SCRAPERS.filter((s) => s.kategori === navn),
  })).filter((k) => k.scrapers.length > 0);

  return (
    <div className="scrapers-layout">
      <div className="scrapers-header">
        <h1 className="scrapers-titel">Scrapers</h1>
        <p className="scrapers-beskrivelse">
          Overblik over alle dataindsamlinger — hvad der kører automatisk, hvornår, og fra hvilken kilde.
        </p>
      </div>

      <ScraperFremgang />
      <ScraperHistorik />
      <MondayOversigt />
      <CvrOpslagPanel />

      <div className="scrapers-kategorier">
        {kategorier.map((kat) => (
          <section key={kat.navn} className="scraper-kategori">
            <h2 className="scraper-kategori-titel">{kat.navn}</h2>
            <div className="scrapers-grid">
              {kat.scrapers.map((scraper) => (
                <ScraperKort
                  key={scraper.id}
                  scraper={scraper}
                  status={statusser[scraper.id] ?? 'idle'}
                  resultat={resultater[scraper.id]}
                  fremgang={fremgang[scraper.id]}
                  log={logs[scraper.id]}
                  badge={getBadge(scraper)}
                  onKør={() => kørScraper(scraper)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <ManuelMatch />
    </div>
  );
}
