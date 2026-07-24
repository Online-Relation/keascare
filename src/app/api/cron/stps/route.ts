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
//   7. Regnskab          — hent årsregnskab fra regnskab.virk.dk (offentlig API)
//
// Tilbudsportalen køres IKKE her — Cloudflare blokerer Railway's IP.
// Kører fra Synology Docker task kl. 03:30.

import { NextRequest, NextResponse } from 'next/server';
import { kørStpsScraper } from '@/features/stps/scraper/StpsScraper/stpsScraper';
import { kørDetaljerScraper } from '@/features/stps/scraper/StpsDetaljerScraper';
import { kørFundItemsScraper } from '@/features/stps/services/StpsFundItemsService';
import { kørPNummerScraper } from '@/features/stps/services/StpsPNummerService';
import { berigMedCvr } from '@/features/stps/services/CvrEnricherService';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { opdaterRegnskab } from '@/features/stps/services/RegnskabService';
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

  // 3. STPS fund-items — kaldes direkte (ikke via HTTP for at undgå Railway self-request timeout)
  await forsøg('stps-fund-items', () => kørFundItemsScraper(30));

  // 4. STPS P-numre — kaldes direkte
  await forsøg('stps-pnummer', () => kørPNummerScraper(50));

  // 5. CVR berig
  await forsøg('cvr-berig', () => berigMedCvr(50));

  // 6. CVR ansatte
  await forsøg('cvr-ansatte', () => opdaterCvrAnsatte(100));

  // 7. Regnskab — regnskab.virk.dk er offentlig API, ikke Cloudflare-beskyttet
  await forsøg('regnskab', () => opdaterRegnskab(50));

}
