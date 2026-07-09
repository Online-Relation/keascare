// src/app/api/scrapers/cvr/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { berigMedCvr } from '@/features/stps/services/CvrEnricherService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const batch = typeof body.batch === 'number' ? body.batch : 10;

    const resultat = await berigMedCvr(batch);
    await logScraperKørsel('cvr-berig', true, { ok: true, ...resultat });
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    await logScraperKørsel('cvr-berig', false, { error: besked });
    return NextResponse.json({ ok: false, error: besked }, { status: 500 });
  }
}
