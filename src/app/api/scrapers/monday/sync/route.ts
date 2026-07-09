// src/app/api/scrapers/monday/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { synkroniserMondayKunder } from '@/features/monday/services/MondaySyncService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    const resultat = await synkroniserMondayKunder();
    await logScraperKørsel('monday-sync', true, { ok: true, ...resultat });
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    await logScraperKørsel('monday-sync', false, { error: besked });
    return NextResponse.json({ ok: false, fejl: besked }, { status: 500 });
  }
}
