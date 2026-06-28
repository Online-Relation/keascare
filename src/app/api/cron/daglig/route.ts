// src/app/api/cron/daglig/route.ts
// Daglig cron-job — kaldes én gang i døgnet via Railway Cron Service eller ekstern scheduler.
// Autentificeres med SCRAPER_SECRET headeren.

import { NextRequest, NextResponse } from 'next/server';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const resultater: Record<string, unknown> = {};

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

  return NextResponse.json({ ok: true, kørt: new Date().toISOString(), ...resultater });
}
