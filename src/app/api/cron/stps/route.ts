// src/app/api/cron/stps/route.ts
//
// Bruges af cron-job.org.
//
// Trin 1 (synkront): STPS liste — henter nye tilsynsrapporter og returnerer et rigtigt svar.
//   Cron-job.org får et reelt resultat og kan registrere fejl korrekt.
//
// Trin 2-4 (baggrund): Detaljer/fund-items/pnummer/CVR — berigelse der ikke er tidskritisk.
//   Kører i baggrunden på Railway efter at svaret er sendt.

import { NextRequest, NextResponse } from 'next/server';
import { kørStpsScraper } from '@/features/stps/scraper/StpsScraper/stpsScraper';
import { kørDetaljerScraper } from '@/features/stps/scraper/StpsDetaljerScraper';
import { berigMedCvr } from '@/features/stps/services/CvrEnricherService';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

function erAutoriseret(req: NextRequest): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return true;
  return req.headers.get('x-scraper-secret') === secret;
}

// Berigelse kører i baggrunden efter at liste-scraper har returneret.
// Fejl her påvirker ikke det primære svar til cron-job.org.
async function kørBerigelse() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const secret = process.env.SCRAPER_SECRET ?? '';
  const headers = { 'Content-Type': 'application/json', 'x-scraper-secret': secret };

  try {
    await kørDetaljerScraper(50);
    await logScraperKørsel('stps-detaljer', true, {});
  } catch (err) {
    await logScraperKørsel('stps-detaljer', false, { error: String(err) });
  }

  try {
    const res = await fetch(`${base}/api/scrapers/stps/fund-items`, {
      method: 'POST', headers, body: JSON.stringify({ batch: 30 }),
    });
    const data = await res.json();
    await logScraperKørsel('stps-fund-items', true, data);
  } catch (err) {
    await logScraperKørsel('stps-fund-items', false, { error: String(err) });
  }

  try {
    const res = await fetch(`${base}/api/scrapers/stps/pnummer`, {
      method: 'POST', headers, body: JSON.stringify({ batch: 50 }),
    });
    const data = await res.json();
    await logScraperKørsel('stps-pnummer', true, data);
  } catch (err) {
    await logScraperKørsel('stps-pnummer', false, { error: String(err) });
  }

  try {
    await berigMedCvr(50);
  } catch (err) {
    await logScraperKørsel('cvr-berig', false, { error: String(err) });
  }

  try {
    await opdaterCvrAnsatte(100);
  } catch (err) {
    await logScraperKørsel('cvr-ansatte', false, { error: String(err) });
  }
}

export async function POST(request: NextRequest) {
  if (!erAutoriseret(request)) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  // Trin 1: Kør liste-scraper synkront — dette er det kritiske trin der finder nye rapporter.
  // Returnerer kun når nye rapporter er gemt i databasen.
  let listeResultat: { fundet: number; nye: number; fejl: string[] };
  try {
    listeResultat = await kørStpsScraper({ maxSider: 10 });
    await logScraperKørsel('stps-liste', true, listeResultat);
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    await logScraperKørsel('stps-liste', false, { error: besked });
    return NextResponse.json({ ok: false, trin: 'stps-liste', error: besked }, { status: 500 });
  }

  // Trin 2-5: Berigelse kører i baggrunden — Railway holder processen i live.
  kørBerigelse().catch(() => {});

  return NextResponse.json({
    ok: true,
    fundet: listeResultat.fundet,
    nye: listeResultat.nye,
    fejl: listeResultat.fejl.length,
    kørt: new Date().toISOString(),
  });
}
