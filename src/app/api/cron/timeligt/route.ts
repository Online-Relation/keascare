// src/app/api/cron/timeligt/route.ts
// Timeligt cron-job — berig CVR-data for bosteder der mangler ansatte/branche.
// Kald med POST og x-scraper-secret header. Sæt op til at køre hver time i Railway.

import { NextRequest, NextResponse } from 'next/server';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    // Batch=5 for at spare cvrapi.dk-kvote til manuelle opslag.
    // Når CVR_USER+CVR_PASS er sat skiftes til virk.dk uden kvotebegrænsning.
    const cvr = await opdaterCvrAnsatte(5);
    await logScraperKørsel('cvr-ansatte', true, cvr);
    return NextResponse.json({ ok: true, kørt: new Date().toISOString(), ...cvr });
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    await logScraperKørsel('cvr-ansatte', false, { error: besked });
    return NextResponse.json({ ok: false, error: besked }, { status: 500 });
  }
}
