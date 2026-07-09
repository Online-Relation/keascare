// src/app/api/scrapers/regnskab/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { opdaterRegnskab } from '@/features/stps/services/RegnskabService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { batch?: number };
  const batch = Math.min(Number(body.batch ?? 50), 200);

  try {
    const resultat = await opdaterRegnskab(batch);
    await logScraperKørsel('regnskab', resultat.fejl === 0, { ok: true, ...resultat });
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    await logScraperKørsel('regnskab', false, { error: besked });
    return NextResponse.json({ ok: false, fejl: besked }, { status: 500 });
  }
}
