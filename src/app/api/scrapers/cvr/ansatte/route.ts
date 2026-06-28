// src/app/api/scrapers/cvr/ansatte/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { opdaterCvrAnsatte } from '@/features/stps/services/CvrAnsatteService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const batch = typeof body.batch === 'number' ? body.batch : 100;

    const resultat = await opdaterCvrAnsatte(batch);
    await logScraperKørsel('cvr-ansatte', true, { ok: true, ...resultat });
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    await logScraperKørsel('cvr-ansatte', false, { error: besked });
    return NextResponse.json({ ok: false, error: besked }, { status: 500 });
  }
}
