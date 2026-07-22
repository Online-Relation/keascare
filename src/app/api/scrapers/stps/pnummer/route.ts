// src/app/api/scrapers/stps/pnummer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { kørPNummerScraper } from '@/features/stps/services/StpsPNummerService';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const batch = typeof body.batch === 'number' ? body.batch : 50;

  try {
    const svar = await kørPNummerScraper(batch);
    return NextResponse.json(svar);
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
