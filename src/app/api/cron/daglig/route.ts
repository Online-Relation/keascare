// src/app/api/cron/daglig/route.ts
// Daglig cron-job — kaldes én gang i døgnet via Railway Cron Service eller ekstern scheduler.
// Autentificeres med SCRAPER_SECRET headeren.
//
// Kørserækkefølge:
//   1. SOR              — synkroniser Sundhedsdatastyrelsens organisationsregister
//   2. STPS liste       — hent nye tilsynsrapporter
//   3. STPS detaljer    — parse PDF'er for rapporter der mangler data
//   4. STPS fund-items  — udtræk strukturerede målepunkter fra PDF'er
//   5. STPS P-numre     — udtræk P-numre fra PDF'er
//   6. CVR berig        — slå P-numre op i CVR og hent CVR-nummer
//   7. CVR ansatte      — opdater ansatte/branche for kendte CVR-numre
//   8. CVR signaler     — søg efter nye bosted-registreringer (kræver CVR_USER+CVR_PASS)
//   9. Regelovervågning — nye love og STPS-nyheder
//  10. Geocoder         — koordinater til kortvisning
//  11. LOS detaljer     — hent detaljer for nye LOS-medlemmer der mangler data
//  12. LOS match        — match LOS-medlemmer mod bosteder via CVR

import { NextRequest, NextResponse } from 'next/server';
import { kørStpsScraper } from '@/features/stps/scraper/StpsScraper/stpsScraper';
import { kørDetaljerScraper } from '@/features/stps/scraper/StpsDetaljerScraper';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { berigMedCvr } from '@/features/stps/services/CvrEnricherService';
import { kørCvrSignalScraper } from '@/features/cvr/scraper/CvrSignalScraper/cvrSignalScraper';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

async function kald(endpoint: string, body: Record<string, unknown>, secret: string): Promise<Record<string, unknown>> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-scraper-secret': secret },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function kør<T>(
  id: string,
  fn: () => Promise<T>,
  resultater: Record<string, unknown>
) {
  try {
    const res = await fn();
    resultater[id] = res;
    await logScraperKørsel(id, true, res as Record<string, unknown>);
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    resultater[id] = { fejl: besked };
    await logScraperKørsel(id, false, { error: besked });
  }
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  // Start jobbet i baggrunden og svar 200 OK med det samme
  // så cron-job.org ikke timeout'er (jobbet kører stadig på Railway)
  kørBaggrund(secret).catch(console.error);
  return NextResponse.json({ ok: true, besked: 'Daglig scraper startet i baggrunden', startet: new Date().toISOString() });
}

async function kørBaggrund(secret: string) {
  const resultater: Record<string, unknown> = {};
  const syncToken = process.env.SYNC_SECRET_TOKEN ?? '';

  // 1. SOR — synkroniser organisationsregister (ingen blokering på Railway)
  await kør('sor-sync', async () => {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/sor/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-token': syncToken },
      body: JSON.stringify({}),
    });
    return res.json() as Promise<Record<string, unknown>>;
  }, resultater);

  // 2. STPS — hent nye tilsynsrapporter
  await kør('stps', () => kørStpsScraper({ maxSider: 10 }), resultater);

  // 2. STPS — parse PDF'er (batch 50)
  await kør('stps-detaljer', () => kørDetaljerScraper(50), resultater);

  // 3. STPS — udtræk strukturerede fund-items (batch 30)
  await kør('stps-fund-items', () => kald('/api/scrapers/stps/fund-items', { batch: 30 }, secret), resultater);

  // 4. STPS — udtræk P-numre fra PDF'er (batch 50)
  await kør('stps-pnummer', () => kald('/api/scrapers/stps/pnummer', { batch: 50 }, secret), resultater);

  // 5. CVR — berig med CVR-nummer via P-nummer (batch 50)
  await kør('cvr-berig', () => berigMedCvr(50), resultater);

  // 6. CVR — opdater ansatte og virksomhedsdata (batch 200)
  await kør('cvr-ansatte', () => opdaterCvrAnsatte(200), resultater);

  // 7. CVR signaler — nye bosted-registreringer (kræver CVR_USER + CVR_PASS)
  if (process.env.CVR_USER && process.env.CVR_PASS) {
    await kør('cvr-signaler', () => kørCvrSignalScraper(2), resultater);
  } else {
    resultater['cvr-signaler'] = { springetOver: 'CVR_USER/CVR_PASS ikke sat' };
  }

  // 8. Regelovervågning — Retsinformation + STPS-nyheder
  await kør('regelovervagning', () => kald('/api/scrapers/regelovervagning', {}, secret), resultater);

  // 9. Geocoder — koordinater til kortvisning (batch 100)
  await kør('geocoder', () => kald('/api/scrapers/geocoder', { batch: 100 }, secret), resultater);

  // 10. LOS — hent detaljer for nye medlemmer (batch 20)
  await kør('los-detaljer', () => kald('/api/scrapers/los', { trin: 'detaljer', max: 20 }, secret), resultater);

  // 11. LOS — match mod bosteder via CVR
  await kør('los-match', () => kald('/api/scrapers/los', { trin: 'match' }, secret), resultater);

  await logScraperKørsel('daglig-cron', true, { kørt: new Date().toISOString(), ...resultater });
}
