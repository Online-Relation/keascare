// src/app/api/cron/stps/route.ts
//
// Bruges af cron-job.org (max 30s timeout).
// Svarer med 200 OK med det samme — Railway fortsætter arbejdet i baggrunden.
//
// Kørserækkefølge (baggrund):
//   1. STPS liste       — hent nye tilsynsrapporter
//   2. STPS detaljer    — parse PDF'er
//   3. STPS fund-items  — udtræk strukturerede målepunkter
//   4. STPS P-numre     — udtræk P-numre
//   5. CVR berig        — slå P-numre op i CVR
//   6. CVR ansatte      — opdater ansatte/branche

import { NextRequest, NextResponse } from 'next/server';
import { kørStpsScraper } from '@/features/stps/scraper/StpsScraper/stpsScraper';
import { kørDetaljerScraper } from '@/features/stps/scraper/StpsDetaljerScraper';
import { berigMedCvr } from '@/features/stps/services/CvrEnricherService';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';
import { opdaterScraperStatus } from '@/lib/db/ScraperStatus';

function erAutoriseret(req: NextRequest): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return true;
  return req.headers.get('x-scraper-secret') === secret;
}

async function kørPipeline() {
  async function trin(id: string, fn: () => Promise<unknown>) {
    await opdaterScraperStatus(id, 'kører', 0, 0);
    try {
      const res = await fn();
      const behandlet = typeof (res as Record<string, unknown>)?.behandlet === 'number'
        ? (res as Record<string, unknown>).behandlet as number
        : 0;
      await logScraperKørsel(id, true, res as Record<string, unknown>);
      await opdaterScraperStatus(id, 'idle', behandlet, behandlet);
    } catch (err) {
      const besked = err instanceof Error ? err.message : String(err);
      await logScraperKørsel(id, false, { error: besked });
      await opdaterScraperStatus(id, 'fejl', 0, 0);
    }
  }

  await trin('stps-liste',    () => kørStpsScraper({ maxSider: 10 }));
  await trin('stps-detaljer', () => kørDetaljerScraper(50));

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const secret = process.env.SCRAPER_SECRET ?? '';
  const headers = { 'Content-Type': 'application/json', 'x-scraper-secret': secret };

  await trin('stps-fund-items', () =>
    fetch(`${base}/api/scrapers/stps/fund-items`, { method: 'POST', headers, body: JSON.stringify({ batch: 30 }) }).then(r => r.json())
  );
  await trin('stps-pnummer', () =>
    fetch(`${base}/api/scrapers/stps/pnummer`, { method: 'POST', headers, body: JSON.stringify({ batch: 50 }) }).then(r => r.json())
  );
  await trin('cvr-berig',   () => berigMedCvr(50));
  await trin('cvr-ansatte', () => opdaterCvrAnsatte(200));
}

export async function POST(request: NextRequest) {
  if (!erAutoriseret(request)) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  // Start pipeline i baggrunden — Railway holder processen i live
  kørPipeline().catch(async (err) => {
    await logScraperKørsel('stps-pipeline', false, { error: String(err) });
  });

  // Svar inden 1 sekund så cron-job.org ikke timeout'er
  return NextResponse.json({ ok: true, started: new Date().toISOString() });
}
