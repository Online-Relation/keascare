// src/app/api/cron/daglig/route.ts
// Daglig cron-job — kaldes én gang i døgnet via Railway Cron Service eller ekstern scheduler.
// Autentificeres med SCRAPER_SECRET headeren.

import { NextRequest, NextResponse } from 'next/server';
import { kørStpsScraper } from '@/features/stps/scraper/StpsScraper/stpsScraper';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { kørCvrSignalScraper } from '@/features/cvr/scraper/CvrSignalScraper/cvrSignalScraper';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const resultater: Record<string, unknown> = {};

  // STPS — hent nye tilsynsrapporter
  try {
    const stps = await kørStpsScraper({ maxSider: 10 });
    resultater.stps = stps;
    await logScraperKørsel('stps', true, stps);
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    resultater.stps = { fejl: besked };
    await logScraperKørsel('stps', false, { error: besked });
  }

  // CVR ansatte — opdater op til 200 bosteder (ældst opdateret først)
  try {
    const cvr = await opdaterCvrAnsatte(200);
    resultater.cvrAnsatte = cvr;
    await logScraperKørsel('cvr-ansatte', true, cvr);
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    resultater.cvrAnsatte = { fejl: besked };
    await logScraperKørsel('cvr-ansatte', false, { error: besked });
  }

  // CVR signaler — søg efter nye bosted-registreringer (kræver CVR_USER + CVR_PASS)
  if (process.env.CVR_USER && process.env.CVR_PASS) {
    try {
      const signaler = await kørCvrSignalScraper(2); // Kun de seneste 2 dage ved daglig kørsel
      resultater.cvrSignaler = signaler;
      await logScraperKørsel('cvr-signaler', true, signaler);
    } catch (err) {
      const besked = err instanceof Error ? err.message : 'Ukendt fejl';
      resultater.cvrSignaler = { fejl: besked };
      await logScraperKørsel('cvr-signaler', false, { error: besked });
    }
  } else {
    resultater.cvrSignaler = { springetOver: 'CVR_USER/CVR_PASS ikke sat' };
  }

  return NextResponse.json({ ok: true, kørt: new Date().toISOString(), ...resultater });
}
