// src/app/api/cron/stps/route.ts
//
// Daglig cron-kørsel — startes af cron-job.org eller Railway scheduler.
// Returnerer straks et svar; al scraping kører i baggrunden på Railway.
//
// Kørserækkefølge:
//   1. STPS liste        — henter nye tilsynsrapporter
//   2. STPS detaljer     — parser PDF'er for rapporter der mangler data
//   3. STPS fund-items   — udtræk strukturerede målepunkter fra PDF'er
//   4. STPS P-numre      — udtræk P-numre fra PDF'er
//   5. CVR berig         — slå P-numre op i CVR og hent CVR-nummer
//   6. CVR ansatte       — opdater ansatte/branche for kendte CVR-numre
//   7. TP liste          — hent alle tilbud fra Tilbudsportalen
//   8. TP detaljer+match — hent detaljer og match mod STPS-rapporter

import { NextRequest, NextResponse } from 'next/server';
import { kørStpsScraper } from '@/features/stps/scraper/StpsScraper/stpsScraper';
import { kørDetaljerScraper } from '@/features/stps/scraper/StpsDetaljerScraper';
import { berigMedCvr } from '@/features/stps/services/CvrEnricherService';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { scraperTilbudsportalenListe } from '@/features/tilbudsportalen/scraper/TilbudsportalenListScraper';
import { scraperTilbudsportalenDetaljer } from '@/features/tilbudsportalen/scraper/TilbudsportalenDetaljerScraper';
import { matchTilbudsportalenTilStps } from '@/features/tilbudsportalen/matcher/TilbudsportalenMatcher';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

function erAutoriseret(req: NextRequest): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return true;
  return req.headers.get('x-scraper-secret') === secret;
}

export async function POST(request: NextRequest) {
  if (!erAutoriseret(request)) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  kørAltIBaggrunden().catch(() => {});

  return NextResponse.json({
    ok: true,
    besked: 'Kørsel startet i baggrunden — tjek Systemstatus for resultat',
    kørt: new Date().toISOString(),
  });
}

async function forsøg<T>(
  id: string,
  fn: () => Promise<T>,
  stopVedFejl = false,
): Promise<boolean> {
  try {
    const res = await fn();
    await logScraperKørsel(id, true, res as Record<string, unknown>);
    return true;
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    await logScraperKørsel(id, false, { error: besked });
    return !stopVedFejl;
  }
}

async function kørAltIBaggrunden() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const secret = process.env.SCRAPER_SECRET ?? '';
  const headers = { 'Content-Type': 'application/json', 'x-scraper-secret': secret };

  // 1. STPS liste — stop hele kørsel ved fejl
  const listeOk = await forsøg('stps-liste', () => kørStpsScraper({ maxSider: 100 }), true);
  if (!listeOk) return;

  // 2. STPS detaljer
  await forsøg('stps-detaljer', () => kørDetaljerScraper(50));

  // 3. STPS fund-items
  await forsøg('stps-fund-items', async () => {
    const res = await fetch(`${base}/api/scrapers/stps/fund-items`, {
      method: 'POST', headers, body: JSON.stringify({ batch: 30 }),
    });
    return res.json() as Promise<Record<string, unknown>>;
  });

  // 4. STPS P-numre
  await forsøg('stps-pnummer', async () => {
    const res = await fetch(`${base}/api/scrapers/stps/pnummer`, {
      method: 'POST', headers, body: JSON.stringify({ batch: 50 }),
    });
    return res.json() as Promise<Record<string, unknown>>;
  });

  // 5. CVR berig
  await forsøg('cvr-berig', () => berigMedCvr(50));

  // 6. CVR ansatte
  await forsøg('cvr-ansatte', () => opdaterCvrAnsatte(100));

  // 7. Tilbudsportalen liste (op til 50 sider)
  await forsøg('tp-liste', () => scraperTilbudsportalenListe(50));

  // 8. Tilbudsportalen detaljer + match mod STPS (match køres automatisk i detaljer-scraper)
  await forsøg('tp-detaljer', async () => {
    const detaljer = await scraperTilbudsportalenDetaljer(30);
    const match = await matchTilbudsportalenTilStps();
    return { ...detaljer, match };
  });
}
